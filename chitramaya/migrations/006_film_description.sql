DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='synopsis') THEN
        ALTER TABLE projects RENAME COLUMN synopsis TO description;
    END IF;
END $$;

ALTER TABLE projects DROP COLUMN IF EXISTS content;
