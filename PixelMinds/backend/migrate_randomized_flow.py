import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Adding 'technical_first' column to 'interview_sessions'...")
        try:
            await conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN technical_first BOOLEAN DEFAULT TRUE"))
            print("Successfully added 'technical_first' column.")
        except Exception as e:
            print(f"Error adding column (it might already exist): {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
