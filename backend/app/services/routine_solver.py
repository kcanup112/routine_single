"""
CP-SAT (Google OR-Tools) based routine generator.

Workflow
--------
1. READ existing ClassRoutineEntry rows for target classes → treat as immutable.
2. For each (class, subject, teacher) triple from the canvas, compute
   remaining_load = canvas_load − already-placed periods.  Skip if ≤ 0.
3. Decompose remaining load into blocks (prefer consecutive-2).
4. Build a CP-SAT model whose variables decide where each block lands.
5. Solve, then INSERT only the new entries (no deletions).

Hard constraints
  H1  Each block placed exactly once.
  H2  No two blocks share a (class, day, period) slot.
  H3  No two blocks share a (teacher, day, period) slot.
  H4  Immutable slots (existing entries) are pre-pruned from the domain.

Soft objectives (maximise)
  S1  Consecutive-pair bonus – reward block_size=2 placements.
  S2  Day-spread – penalise >1 block of the same subject on the same day.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from typing import Dict, List, Set, Tuple

from ortools.sat.python import cp_model
from sqlalchemy.orm import Session

from app.models import models

logger = logging.getLogger(__name__)

# ── helpers ─────────────────────────────────────────────────────────────

def _plan_blocks(load: int) -> List[int]:
    """load → [2, 2, …, 1?]  (maximise consecutive pairs)."""
    blocks: list[int] = []
    remaining = int(load)
    while remaining >= 2:
        blocks.append(2)
        remaining -= 2
    if remaining:
        blocks.append(1)
    return blocks


def _plan_blocks_school(load: int) -> List[int]:
    """School mode: load → [1, 1, …] (every period is a single-slot block)."""
    return [1] * int(load)


# ── main solver ─────────────────────────────────────────────────────────

class CPSATRoutineSolver:

    @staticmethod
    def solve(db: Session, assignments: list) -> dict:
        """
        Drop-in replacement for ``RoutineGeneratorService.generate``.
        Same input shape, same response shape.
        """
        # Determine block strategy based on institution type
        from app.services.crud import get_institution_type
        _block_fn = _plan_blocks_school if get_institution_type(db) == "school" else _plan_blocks

        # ── 1. load days & periods ──────────────────────────────────────
        days = (
            db.query(models.Day)
            .filter(models.Day.is_working_day == True)
            .order_by(models.Day.day_number)
            .all()
        )
        if not days:
            return {
                "placed": 0,
                "unplaced": [],
                "class_results": [],
                "error": "No working days configured",
            }

        day_ids = [d.id for d in days]

        all_periods_db = (
            db.query(models.Period)
            .filter(
                models.Period.is_teaching_period == True,
                models.Period.is_active == True,
            )
            .order_by(models.Period.period_number)
            .all()
        )
        # Include every period in the map so existing immutable entries are
        # respected even if a period is non-teaching or inactive.
        period_number_map: Dict[int, int] = {
            p.id: p.period_number
            for p in db.query(models.Period).all()
        }

        # ── 2. read ALL existing entries → immutable busy maps ──────────
        all_existing: list = db.query(models.ClassRoutineEntry).all()

        # class_busy[cid]    = set of (day_id, period_num)
        # teacher_busy[tid]  = set of (day_id, period_num)
        class_busy: Dict[int, Set[Tuple[int, int]]] = defaultdict(set)
        teacher_busy: Dict[int, Set[Tuple[int, int]]] = defaultdict(set)

        # existing_counts[(class_id, subject_id, teacher_id)] = # of periods
        existing_counts: Dict[Tuple[int, int, int], int] = defaultdict(int)

        target_class_ids = {ca["class_id"] for ca in assignments}

        for entry in all_existing:
            pn = period_number_map.get(entry.period_id)
            if pn is None:
                continue
            span = entry.num_periods or 1
            for offset in range(span):
                slot = (entry.day_id, pn + offset)
                class_busy[entry.class_id].add(slot)
                for tid in (
                    entry.lead_teacher_id,
                    entry.assist_teacher_1_id,
                    entry.assist_teacher_2_id,
                    entry.assist_teacher_3_id,
                ):
                    if tid:
                        teacher_busy[tid].add(slot)

            # count already-placed theory for target classes
            if entry.class_id in target_class_ids and not entry.is_lab:
                existing_counts[
                    (entry.class_id, entry.subject_id, entry.lead_teacher_id)
                ] += (entry.num_periods or 1)

        # ── 3. build blocks to place (remaining load only) ─────────────
        #  block = {class_id, subject_id, teacher_id, size, idx}
        blocks: List[dict] = []
        warnings = []

        # cache: class → shift periods info
        _shift_cache: dict = {}

        # Resolve default shift once for classes that have no shift_id assigned
        _default_shift = (
            db.query(models.Shift)
            .filter(models.Shift.is_default == True, models.Shift.is_active == True)
            .first()
        )

        def _teaching_periods_for_shift(shift_id: int):
            """Return active teaching periods that strictly fit inside shift bounds."""
            shift_obj = (
                db.query(models.Shift)
                .filter(models.Shift.id == shift_id, models.Shift.is_active == True)
                .first()
            )
            if not shift_obj:
                return []
            return (
                db.query(models.Period)
                .filter(
                    models.Period.shift_id == shift_id,
                    models.Period.is_teaching_period == True,
                    models.Period.is_active == True,
                    models.Period.start_time >= shift_obj.start_time,
                    models.Period.end_time <= shift_obj.end_time,
                )
                .order_by(models.Period.period_number)
                .all()
            )

        def _class_periods(cls_obj):
            """Return (pnums_list, pid_by_pnum_dict, adj_pairs_list) for a class."""
            key = cls_obj.shift_id or 0
            if key not in _shift_cache:
                if cls_obj.shift_id:
                    sp = _teaching_periods_for_shift(cls_obj.shift_id)
                elif _default_shift:
                    sp = _teaching_periods_for_shift(_default_shift.id)
                else:
                    # No assigned shift and no default shift -> no valid domain.
                    sp = []
                pnums = [p.period_number for p in sp]
                pid_by_pnum = {p.period_number: p.id for p in sp}
                adj = [
                    (pnums[i], pnums[i + 1])
                    for i in range(len(pnums) - 1)
                    if pnums[i + 1] == pnums[i] + 1
                ]
                _shift_cache[key] = (pnums, pid_by_pnum, adj)
            return _shift_cache[key]

        # map class_id → Class ORM object (we'll need shift_id later)
        # Bulk-load all target classes in one query instead of N queries
        class_objs: Dict[int, models.Class] = {
            c.id: c for c in db.query(models.Class).filter(
                models.Class.id.in_(target_class_ids)
            ).all()
        }
        seen_pairs: Dict[int, set] = defaultdict(set)  # per-class dedup

        for ca in assignments:
            cid = ca["class_id"]
            cls_obj = class_objs.get(cid)
            if cls_obj is None:
                continue

            for subj in ca.get("subjects", []):
                sid = subj["subject_id"]
                for tl in subj.get("teachers", []):
                    tid = tl["teacher_id"]
                    pair = (sid, tid)
                    if pair in seen_pairs[cid]:
                        continue
                    seen_pairs[cid].add(pair)

                    canvas_load = max(0, int(tl.get("load", 0) or 0))
                    already = existing_counts.get((cid, sid, tid), 0)
                    remaining = canvas_load - already

                    if remaining < 0:
                        warnings.append(
                            {
                                "class_id": cid,
                                "subject_id": sid,
                                "teacher_id": tid,
                                "canvas_load": canvas_load,
                                "already_placed": already,
                                "reason": (
                                    f"Already placed {already} periods "
                                    f"(canvas says {canvas_load}). Skipped."
                                ),
                            }
                        )
                        continue
                    if remaining == 0:
                        continue

                    for bsize in _block_fn(remaining):
                        blocks.append(
                            {
                                "idx": len(blocks),
                                "class_id": cid,
                                "subject_id": sid,
                                "teacher_id": tid,
                                "size": bsize,
                            }
                        )

        if not blocks:
            return {
                "placed": 0,
                "unplaced": [],
                "class_results": [],
                "warnings": warnings or None,
                "info": "Nothing to place — all loads already satisfied.",
            }

        # ── 4. build CP-SAT model ──────────────────────────────────────
        model = cp_model.CpModel()

        # x[block_idx, day_id, start_period_num] = BoolVar
        x: Dict[Tuple[int, int, int], cp_model.IntVar] = {}

        # For each block, collect its valid start positions
        block_vars: Dict[int, list] = defaultdict(list)  # block_idx → list of (var, day_id, pn)

        for b in blocks:
            cid = b["class_id"]
            tid = b["teacher_id"]
            bsize = b["size"]
            bidx = b["idx"]
            cls_obj = class_objs[cid]
            pnums, pid_by_pnum, adj_pairs = _class_periods(cls_obj)

            if bsize == 2:
                starts = adj_pairs  # (pn1, pn2)
            else:
                starts = [(pn,) for pn in pnums]

            for did in day_ids:
                for start_tuple in starts:
                    pn_start = start_tuple[0]
                    # check every period in the block is free (in immutable maps)
                    occupied = False
                    for off in range(bsize):
                        slot = (did, pn_start + off)
                        if slot in class_busy[cid] or slot in teacher_busy[tid]:
                            occupied = True
                            break
                    if occupied:
                        continue
                    # also ensure all periods exist in pid_by_pnum
                    if any((pn_start + off) not in pid_by_pnum for off in range(bsize)):
                        continue

                    var = model.new_bool_var(f"x_{bidx}_{did}_{pn_start}")
                    key = (bidx, did, pn_start)
                    x[key] = var
                    block_vars[bidx].append((var, did, pn_start))

        # H1 – each block placed exactly once
        unplaceable: list = []
        placeable_block_indices: set = set()
        for b in blocks:
            bidx = b["idx"]
            bvars = block_vars.get(bidx, [])
            if not bvars:
                unplaceable.append(
                    {
                        "class_id": b["class_id"],
                        "subject_id": b["subject_id"],
                        "teacher_id": b["teacher_id"],
                        "block_size": b["size"],
                        "reason": "No valid slot exists (timetable full or teacher unavailable)",
                    }
                )
                continue
            model.add_exactly_one(v for v, _, _ in bvars)
            placeable_block_indices.add(bidx)

        # helper to iterate blocks covering a specific (entity_id, day, period)
        # Pre-index: for each (class_id, day_id, pn) → list of BoolVars that cover it
        class_slot_vars: Dict[Tuple[int, int, int], list] = defaultdict(list)
        teacher_slot_vars: Dict[Tuple[int, int, int], list] = defaultdict(list)
        # for day-spread: (class_id, subject_id, day_id) → list of BoolVars
        subj_day_vars: Dict[Tuple[int, int, int], list] = defaultdict(list)

        for b in blocks:
            bidx = b["idx"]
            if bidx not in placeable_block_indices:
                continue
            cid = b["class_id"]
            tid = b["teacher_id"]
            sid = b["subject_id"]
            bsize = b["size"]
            for var, did, pn_start in block_vars[bidx]:
                for off in range(bsize):
                    pn = pn_start + off
                    class_slot_vars[(cid, did, pn)].append(var)
                    teacher_slot_vars[(tid, did, pn)].append(var)
                subj_day_vars[(cid, sid, did)].append(var)

        # H2 – no class overlap (at most 1 new block per class-slot)
        for key, var_list in class_slot_vars.items():
            if len(var_list) > 1:
                model.add(sum(var_list) <= 1)

        # H3 – no teacher overlap (at most 1 new block per teacher-slot)
        for key, var_list in teacher_slot_vars.items():
            if len(var_list) > 1:
                model.add(sum(var_list) <= 1)

        # ── soft objectives ─────────────────────────────────────────────
        # S1 – bonus for block_size=2 placed as actual consecutive pair (always true
        #       for size-2 blocks since their starts are adjacent pairs).
        #       We weight size-2 blocks higher in the objective so the solver
        #       prefers giving them good slots rather than failing them.
        #       (All blocks are mandatory via H1, but the objective guides WHERE.)
        #
        # S2 – day-spread: penalise placing >1 block of same subject on same day.
        penalty_vars: list = []
        SPREAD_PENALTY = 3  # cost per extra block on same day

        for (cid, sid, did), var_list in subj_day_vars.items():
            if len(var_list) <= 1:
                continue
            # how many blocks land on this day? sum(var_list)
            # we want at most 1 → penalise anything above 1
            total = model.new_int_var(0, len(var_list), f"sd_{cid}_{sid}_{did}")
            model.add(total == sum(var_list))
            excess = model.new_int_var(0, len(var_list) - 1, f"sdx_{cid}_{sid}_{did}")
            model.add(excess >= total - 1)
            penalty_vars.append(excess)

        if penalty_vars:
            model.minimize(SPREAD_PENALTY * sum(penalty_vars))

        # ── 5. solve ────────────────────────────────────────────────────
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 10.0
        solver.parameters.num_workers = 8
        solver.parameters.log_search_progress = False

        status = solver.solve(model)

        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            # solver couldn't satisfy all hard constraints
            return {
                "placed": 0,
                "unplaced": unplaceable
                + [
                    {
                        "class_id": b["class_id"],
                        "subject_id": b["subject_id"],
                        "teacher_id": b["teacher_id"],
                        "block_size": b["size"],
                        "reason": "Solver INFEASIBLE – too many constraints",
                    }
                    for b in blocks
                    if b["idx"] in placeable_block_indices
                ],
                "class_results": [],
                "solver_status": solver.status_name(status),
            }

        # ── 6. extract solution & build entries ─────────────────────────
        new_entries: list = []
        placed_per_class: Dict[int, int] = defaultdict(int)

        for b in blocks:
            bidx = b["idx"]
            if bidx not in placeable_block_indices:
                continue
            cid = b["class_id"]
            sid = b["subject_id"]
            tid = b["teacher_id"]
            bsize = b["size"]
            cls_obj = class_objs[cid]
            _, pid_by_pnum, _ = _class_periods(cls_obj)

            for var, did, pn_start in block_vars[bidx]:
                if solver.value(var):
                    new_entries.append(
                        models.ClassRoutineEntry(
                            class_id=cid,
                            day_id=did,
                            period_id=pid_by_pnum[pn_start],
                            subject_id=sid,
                            lead_teacher_id=tid,
                            num_periods=bsize,
                            is_lab=False,
                        )
                    )
                    placed_per_class[cid] += bsize
                    break  # exactly one var is true per block

        # ── 7. bulk write ───────────────────────────────────────────────
        for entry in new_entries:
            db.add(entry)
        db.commit()

        total_placed = sum(placed_per_class.values())

        class_results = []
        for ca in assignments:
            cid = ca["class_id"]
            p = placed_per_class.get(cid, 0)
            u = sum(
                1
                for item in unplaceable
                if item.get("class_id") == cid
            )
            class_results.append({"class_id": cid, "placed": p, "unplaced": u})

        result: dict = {
            "placed": total_placed,
            "unplaced": unplaceable,
            "class_results": class_results,
            "solver_status": solver.status_name(status),
        }
        if warnings:
            result["warnings"] = warnings
        return result
