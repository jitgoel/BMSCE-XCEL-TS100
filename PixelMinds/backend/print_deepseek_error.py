import asyncio
import os
import httpx
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

async def main():
    api_key = os.getenv("LLM_API_KEY")
    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com",
        http_client=httpx.AsyncClient(verify=False)
    )
    
    try:
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hi"}
            ],
            max_tokens=2000
        )
        print(response.choices[0].message.content)
    except Exception as e:
        if hasattr(e, 'response'):
            with open("ds_error_out.txt", "w", encoding="utf-8") as f:
                f.write(e.response.text)
        print("Logged error to ds_error_out.txt")

if __name__ == "__main__":
    asyncio.run(main())
