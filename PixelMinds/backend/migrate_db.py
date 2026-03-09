import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate_db():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        print("Running migrations...")
        
        # Add traits column to onboarding_answers
        try:
            await conn.execute(text("ALTER TABLE onboarding_answers ADD COLUMN traits JSONB;"))
            print("Added 'traits' column to onboarding_answers.")
        except Exception as e:
            if "already exists" in str(e):
                print("'traits' column already exists in onboarding_answers.")
            else:
                print(f"Error adding 'traits' column: {e}")
                
        # Create candidate_traits table
        try:
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS candidate_traits (
                  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
                  traits JSONB,
                  calculated_at TIMESTAMP DEFAULT NOW()
                );
            """))
            print("Created 'candidate_traits' table.")
        except Exception as e:
            print(f"Error creating 'candidate_traits' table: {e}")
            
        # Create index
        try:
            await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_traits_candidate_id ON candidate_traits(candidate_id);"))
            print("Created index 'idx_traits_candidate_id'.")
        except Exception as e:
            print(f"Error creating index: {e}")

    await engine.dispose()
    print("Migrations complete.")

if __name__ == "__main__":
    asyncio.run(migrate_db())
