-- Fix teacher FK constraints on class_routine_entries and teacher_effective_loads
-- for the kec schema

DO $$
DECLARE
    fk_name text;
BEGIN
    -- lead_teacher_id
    SELECT conname INTO fk_name FROM pg_constraint
    WHERE conrelid = 'kec.class_routine_entries'::regclass
      AND confrelid = 'kec.teachers'::regclass
      AND conkey = (SELECT array_agg(attnum) FROM pg_attribute WHERE attrelid='kec.class_routine_entries'::regclass AND attname='lead_teacher_id');
    IF fk_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE kec.class_routine_entries DROP CONSTRAINT %I', fk_name);
    END IF;
    ALTER TABLE kec.class_routine_entries ADD CONSTRAINT fk_cre_lead_teacher
        FOREIGN KEY (lead_teacher_id) REFERENCES kec.teachers(id) ON DELETE SET NULL;

    -- assist_teacher_1_id
    SELECT conname INTO fk_name FROM pg_constraint
    WHERE conrelid = 'kec.class_routine_entries'::regclass
      AND confrelid = 'kec.teachers'::regclass
      AND conkey = (SELECT array_agg(attnum) FROM pg_attribute WHERE attrelid='kec.class_routine_entries'::regclass AND attname='assist_teacher_1_id');
    IF fk_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE kec.class_routine_entries DROP CONSTRAINT %I', fk_name);
    END IF;
    ALTER TABLE kec.class_routine_entries ADD CONSTRAINT fk_cre_assist1
        FOREIGN KEY (assist_teacher_1_id) REFERENCES kec.teachers(id) ON DELETE SET NULL;

    -- assist_teacher_2_id
    SELECT conname INTO fk_name FROM pg_constraint
    WHERE conrelid = 'kec.class_routine_entries'::regclass
      AND confrelid = 'kec.teachers'::regclass
      AND conkey = (SELECT array_agg(attnum) FROM pg_attribute WHERE attrelid='kec.class_routine_entries'::regclass AND attname='assist_teacher_2_id');
    IF fk_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE kec.class_routine_entries DROP CONSTRAINT %I', fk_name);
    END IF;
    ALTER TABLE kec.class_routine_entries ADD CONSTRAINT fk_cre_assist2
        FOREIGN KEY (assist_teacher_2_id) REFERENCES kec.teachers(id) ON DELETE SET NULL;

    -- assist_teacher_3_id
    SELECT conname INTO fk_name FROM pg_constraint
    WHERE conrelid = 'kec.class_routine_entries'::regclass
      AND confrelid = 'kec.teachers'::regclass
      AND conkey = (SELECT array_agg(attnum) FROM pg_attribute WHERE attrelid='kec.class_routine_entries'::regclass AND attname='assist_teacher_3_id');
    IF fk_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE kec.class_routine_entries DROP CONSTRAINT %I', fk_name);
    END IF;
    ALTER TABLE kec.class_routine_entries ADD CONSTRAINT fk_cre_assist3
        FOREIGN KEY (assist_teacher_3_id) REFERENCES kec.teachers(id) ON DELETE SET NULL;

    -- teacher_effective_loads
    SELECT conname INTO fk_name FROM pg_constraint
    WHERE conrelid = 'kec.teacher_effective_loads'::regclass
      AND confrelid = 'kec.teachers'::regclass;
    IF fk_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE kec.teacher_effective_loads DROP CONSTRAINT %I', fk_name);
    END IF;
    ALTER TABLE kec.teacher_effective_loads ADD CONSTRAINT fk_tel_teacher
        FOREIGN KEY (teacher_id) REFERENCES kec.teachers(id) ON DELETE CASCADE;
END
$$;
