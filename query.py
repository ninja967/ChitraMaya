import sqlite3, json
c = sqlite3.connect("/root/chitramaya/jobs.db").cursor()
res = c.execute("SELECT prompt_id, job_type, created_at, status FROM jobs ORDER BY created_at DESC LIMIT 5;").fetchall()
print(json.dumps(res, indent=2))
