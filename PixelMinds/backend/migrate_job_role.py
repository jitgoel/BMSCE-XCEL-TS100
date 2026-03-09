import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        print("Dropping existing interview_sessions table...")
        await conn.execute(text("DROP TABLE IF EXISTS interview_sessions CASCADE;"))
        
        print("Recreating interview_sessions table with job_role...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS interview_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
                job_role TEXT DEFAULT 'Software Engineer',
                started_at TIMESTAMP DEFAULT NOW(),
                current_state TEXT DEFAULT 'TECH_1',
                question_count INTEGER DEFAULT 0,
                chat_history JSONB DEFAULT '[]',
                analyst_report JSONB,
                completed BOOLEAN DEFAULT FALSE
            );
        """))
        print("Table recreated.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
