import os
import base64
import asyncio
from groq import Groq
from .base import AIProvider
from dotenv import load_dotenv

load_dotenv()

class GroqProvider(AIProvider):
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.text_model = "llama-3.3-70b-versatile"
        self.vision_model = "llama-3.2-90b-vision-preview"

    def _encode_image(self, image_bytes):
        return base64.b64encode(image_bytes).decode('utf-8')

    async def generate_response(self, prompt: str, image_data: bytes = None):
        """Standard non-streaming response (Legacy support)"""
        # We can reuse the logic, but for now let's keep it simple
        # This method is required by the abstract base class if we haven't updated base.py strictly
        pass 

    async def generate_stream(self, prompt: str, image_data: bytes = None):
        """New Streaming response"""
        try:
            messages = []
            model = self.text_model

            if image_data:
                print("Image detected! Switching to Vision Model.")
                model = self.vision_model
                base64_image = self._encode_image(image_data)
                messages.append({
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt or "Describe this image"},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]
                })
            else:
                messages.append({"role": "user", "content": prompt})

            # Create stream
            stream = self.client.chat.completions.create(
                messages=messages,
                model=model,
                stream=True  # ENABLE STREAMING
            )

            for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    yield content
                    await asyncio.sleep(0.01)

        except Exception as e:
            yield f"Error from Groq: {str(e)}"