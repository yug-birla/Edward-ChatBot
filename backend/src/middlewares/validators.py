from fastapi import UploadFile, File, HTTPException

# 5MB in bytes
MAX_FILE_SIZE = 5 * 1024 * 1024 
ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

async def validate_image(image: UploadFile = File(None)):
    """
    Validates the 'image' field from the form-data.
    """
    if not image:
        return None

    # 1. Check File Type (MIME type)
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type: {image.content_type}. Only JPEG, PNG, and WEBP are allowed."
        )

    # 2. Check File Size
    # We read the file to check its size
    content = await image.read()
    file_size = len(content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File is too large. Maximum size is 5MB."
        )

    # Reset file cursor so the next function can read it from the beginning
    await image.seek(0)
    
    return image