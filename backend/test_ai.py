import asyncio
from src.providers.gemini import GeminiProvider
from src.providers.groq import GroqProvider

async def test():
    print("--- Testing Gemini ---")
    gemini = GeminiProvider()
    response_g = await gemini.generate_response("Hello Gemini! Are you there?")
    print(f"Gemini says: {response_g}\n")

    print("--- Testing Groq ---")
    groq = GroqProvider()
    response_q = await groq.generate_response("Hello Groq! Are you there?")
    print(f"Groq says: {response_q}\n")

if __name__ == "__main__":
    asyncio.run(test())