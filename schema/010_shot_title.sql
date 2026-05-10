-- Add title and speaker columns to project_shots
ALTER TABLE project_shots ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE project_shots ADD COLUMN IF NOT EXISTS speaker TEXT;
