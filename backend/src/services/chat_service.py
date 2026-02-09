from ..providers.gemini import GeminiProvider
from ..providers.groq import GroqProvider

class ChatService:
    def __init__(self):
        self.gemini = GeminiProvider()
        self.groq = GroqProvider()

    async def get_streaming_response(self, provider_name: str, prompt: str, image_data: bytes = None):
        """
        Determines primary/backup and yields the stream.
        """
        # 1. Determine Primary and Backup
        if provider_name.lower() == "gemini":
            primary = self.gemini
            backup = self.groq
            primary_name = "Gemini"
            backup_name = "Groq"
        else:
            primary = self.groq
            backup = self.gemini
            primary_name = "Groq"
            backup_name = "Gemini"
        
        try:
            print(f"Stream starting with {primary_name}...")
            # Yield from primary
            async for chunk in primary.generate_stream(prompt, image_data):
                if "Error from" in chunk: # Check for internal error messages
                    raise Exception(chunk)
                yield chunk
                
        except Exception as e:
            print(f"⚠️ Primary ({primary_name}) failed: {e}")
            yield f"\n\n[System: {primary_name} failed. Switching to {backup_name}...]\n\n"
            
            try:
                # Yield from backup
                async for chunk in backup.generate_stream(prompt, image_data):
                    yield chunk
            except Exception as e2:
                yield f"❌ System Failure: Both models failed.\nError: {e2}"