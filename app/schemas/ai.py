from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    current_page: str = "/ai" # Default value

class ChatResponse(BaseModel):
    response: str