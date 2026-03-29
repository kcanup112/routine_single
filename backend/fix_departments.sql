-- Add description column to departments table in all test tenant schemas
ALTER TABLE "kec-test".departments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE "pec-test".departments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE "ioe-test".departments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE "ku-test".departments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE "tu-test".departments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE "nast-test".departments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE "ace-test".departments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE "khwopa-test".departments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE "thapathali-test".departments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE "everest-test".departments ADD COLUMN IF NOT EXISTS description TEXT;
