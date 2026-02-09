from abc import ABC, abstractmethod
from typing import AsyncGenerator

class AIProvider(ABC):
    @abstractmethod
    async def generate_stream(self, prompt: str, image_data: bytes = None) -> AsyncGenerator[str, None]:
        """
        Yields chunks of text as they are generated.
        """
        pass