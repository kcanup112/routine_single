-- Add deleted_at column to rooms table in all test tenant schemas
ALTER TABLE "kec-test".rooms ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE "pec-test".rooms ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE "ioe-test".rooms ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE "ku-test".rooms ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE "tu-test".rooms ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE "nast-test".rooms ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE "ace-test".rooms ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE "khwopa-test".rooms ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE "thapathali-test".rooms ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE "everest-test".rooms ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
