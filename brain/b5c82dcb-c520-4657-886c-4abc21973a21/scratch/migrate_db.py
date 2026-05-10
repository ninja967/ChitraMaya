import asyncio
import os
from core.chitramaya.store import get_pool, init_db
from core.chitramaya.settings import get_settings

async def migrate():
    # Load env for DATABASE_URL
    from dotenv import load_dotenv
    load_dotenv()
    
    await init_db()
    pool = get_pool()
    
    print("Checking project_shots columns...")
    # Check for 'title' column
    res = await pool.fetchval("""
        SELECT count(*) FROM information_schema.columns 
        WHERE table_name = 'project_shots' AND column_name = 'title'
    """)
    if res == 0:
        print("Adding 'title' column to project_shots...")
        await pool.execute("ALTER TABLE project_shots ADD COLUMN title TEXT;")
    else:
        print("'title' column already exists.")

    # Check for 'speaker' column
    res = await pool.fetchval("""
        SELECT count(*) FROM information_schema.columns 
        WHERE table_name = 'project_shots' AND column_name = 'speaker'
    """)
    if res == 0:
        print("Adding 'speaker' column to project_shots...")
        await pool.execute("ALTER TABLE project_shots ADD COLUMN speaker TEXT;")
    else:
        print("'speaker' column already exists.")
        
    print("Migration complete.")
    await pool.close()

if __name__ == "__main__":
    asyncio.run(migrate())
