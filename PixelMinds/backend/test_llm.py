import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from interview.llm_client import call_llm

async def main():
    system_prompt = "You are a helpful assistant."
    messages = [
        {"role": "user", "content": "Hi, I am ready to begin the interview for the Software Engineer role."}
    ]
    
    print(f"Using API Key starting with: {os.getenv('LLM_API_KEY', '')[:10]}...")
    
    try:
        response = await call_llm(system_prompt, messages)
        print("Success! Response:")
        print(response)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Detailed Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
