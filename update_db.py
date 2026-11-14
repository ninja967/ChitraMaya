import asyncio
import asyncpg

async def run():
    try:
        conn = await asyncpg.connect('postgresql://chitramaya:chitramaya_pass@localhost:5432/chitramaya')
        await conn.execute("UPDATE projects SET aspect_ratio = '16:9'")
        print('All projects updated to 16:9 successfully!')
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(run())
