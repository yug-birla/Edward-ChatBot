import os
import asyncio
from google import genai
from .base import AIProvider
from dotenv import load_dotenv
from PIL import Image
import io

load_dotenv()

class GeminiProvider(AIProvider):
    def __init__(self):
        # Initialize the Client
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        
        # --- CRITICAL FIX ---
        # We are using 1.5 because 2.5 has a limit of 20/day.
        self.model_name = "models/gemini-2.5-flash" 
        
        print(f"✅ GEMINI PROVIDER LOADED. USING MODEL: {self.model_name}")

    async def generate_response(self, prompt: str, image_data: bytes = None):
        try:
            if image_data:
                image = Image.open(io.BytesIO(image_data))
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=[prompt, image]
                )
            else:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
            return response.text
        except Exception as e:
            return f"Error from Gemini: {str(e)}"

    async def generate_stream(self, prompt: str, image_data: bytes = None):
        try:
            if image_data:
                image = Image.open(io.BytesIO(image_data))
                response = self.client.models.generate_content_stream(
                    model=self.model_name,
                    contents=[prompt, image]
                )
            else:
                response = self.client.models.generate_content_stream(
                    model=self.model_name,
                    contents=prompt
                )
            
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    await asyncio.sleep(0.01)

        except Exception as e:
            yield f"Error from Gemini: {str(e)}"