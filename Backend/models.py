from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class Lead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    name: str
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    rating: Optional[float] = None
    reviews_count: Optional[int] = 0
    is_website_broken: Optional[bool] = False
    is_social_only: Optional[bool] = False
    score: Optional[float] = 0.0
    tier: Optional[str] = None
    status: str = "NEW"
