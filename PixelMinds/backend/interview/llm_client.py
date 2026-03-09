import os
import httpx
from openai import AsyncOpenAI
import random

# Global counter to simple round-robin between keys (or just random choice)
_call_counter = 0

def get_client():
    global _call_counter
    # Alternate between key 1 and key 2
    key_idx = (_call_counter % 2) + 1
    api_key = os.getenv(f"LLM_API_KEY_{key_idx}")
    _call_counter += 1
    
    if not api_key:
        print(f"[WARNING] LLM_API_KEY_{key_idx} is missing from environment variables")
        # Fallback to key 1 if 2 is missing
        api_key = os.getenv("LLM_API_KEY_1", "")
        
    http_client = httpx.AsyncClient(verify=False)
    # Groq API uses OpenAI compatible format
    return AsyncOpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1",
        http_client=http_client
    )

async def call_llm(system_prompt: str, messages: list) -> str:
    """
    Calls the Groq API (via OpenAI SDK) with the given system prompt and chat history.
    """
    client = get_client()
    model = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
    
    # Prepend the system prompt to the messages array
    formatted_messages = [{"role": "system", "content": system_prompt}] + messages
    
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=formatted_messages,
            max_tokens=2000,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[llm_client] API call failed: {e}")
        raise e
