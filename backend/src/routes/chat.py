from fastapi import APIRouter, UploadFile, Form, HTTPException, Depends
from fastapi.responses import StreamingResponse
from ..services.chat_service import ChatService
from ..middlewares.validators import validate_image

router = APIRouter()
chat_service = ChatService()

@router.post("/completion")
async def chat_completion(
    prompt: str = Form(...),
    provider: str = Form(...),
    image: UploadFile = Depends(validate_image)
):
    try:
        image_data = None
        if image:
            image_data = await image.read()
        
        # KEY CHANGE: Return StreamingResponse, NOT a dict
        return StreamingResponse(
            chat_service.get_streaming_response(provider, prompt, image_data),
            media_type="text/plain"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))