from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database_saas import get_db
from app.schemas import schemas
from app.services.crud import TeacherService
from app.auth.dependencies import require_read_access, require_write_access
from app.models.models import User
from app.models.models import Teacher as TeacherModel
from app.auth.password import get_password_hash

router = APIRouter(prefix="/teachers", tags=["teachers"])

DEFAULT_TEACHER_PASSWORD = "kec123"


def _auto_create_account(db: Session, teacher, role: str = 'viewer'):
    """Auto-create a user account for a teacher with an email.
    Returns (user, password) or (None, None) if teacher has no email.
    """
    if not teacher.email:
        return None, None
    
    if role not in ('admin', 'viewer'):
        role = 'viewer'
    
    # Check if a user with this email already exists
    existing = db.query(User).filter(
        User.email == teacher.email,
    ).first()
    if existing:
        # Link existing user if not already linked
        teacher.user_id = existing.id
        return existing, None
    
    new_user = User(
        email=teacher.email,
        full_name=teacher.name,
        password_hash=get_password_hash(DEFAULT_TEACHER_PASSWORD),
        role=role,
        is_active=True,
    )
    db.add(new_user)
    db.flush()  # Get user.id
    teacher.user_id = new_user.id
    return new_user, DEFAULT_TEACHER_PASSWORD


@router.post("/")
def create_teacher(
    teacher: schemas.TeacherCreate,
    request: Request,
    account_role: Optional[str] = Query('viewer', description="Role for auto-created account: admin or viewer"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_access),
):
    created = TeacherService.create(db, teacher)
    
    # Auto-create account if teacher has email
    teacher_obj = db.query(TeacherModel).filter(TeacherModel.id == created.id).first()
    user_account, temp_password = _auto_create_account(db, teacher_obj, role=account_role)
    db.commit()
    db.refresh(teacher_obj)
    
    # Build response
    response_data = schemas.Teacher.model_validate(teacher_obj).model_dump()
    response_data['has_account'] = teacher_obj.user_id is not None
    if temp_password:
        response_data['temp_password'] = temp_password
    return response_data

@router.get("/", response_model=List[schemas.Teacher])
def get_teachers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(require_read_access)):
    return TeacherService.get_all(db, skip, limit)

@router.get("/{teacher_id}/", response_model=schemas.Teacher)
def get_teacher(teacher_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_read_access)):
    teacher = TeacherService.get_by_id(db, teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher

@router.put("/{teacher_id}/", response_model=schemas.Teacher)
def update_teacher(teacher_id: int, teacher: schemas.TeacherUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_write_access)):
    updated = TeacherService.update(db, teacher_id, teacher)
    if not updated:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return updated

@router.delete("/{teacher_id}/")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_write_access)):
    # Deactivate linked user account before deleting teacher
    teacher_obj = db.query(TeacherModel).filter(TeacherModel.id == teacher_id).first()
    if teacher_obj and teacher_obj.user_id:
        linked_user = db.query(User).filter(User.id == teacher_obj.user_id).first()
        if linked_user:
            linked_user.is_active = False
    
    deleted = TeacherService.delete(db, teacher_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return {"message": "Teacher deleted successfully"}
