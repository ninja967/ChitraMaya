-- Add missing columns to projects and project_shots to match frontend models
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE project_shots ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE project_shots ADD COLUMN IF NOT EXISTS speaker TEXT;
