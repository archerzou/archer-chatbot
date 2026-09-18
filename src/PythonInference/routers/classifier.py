import torch
from fastapi import APIRouter
from pydantic import BaseModel
from transformers import pipeline

router = APIRouter()
# Use the GPU when a CUDA device is available, otherwise fall back to CPU (device=-1).
device = 0 if torch.cuda.is_available() else -1
classifier = pipeline('zero-shot-classification', model='cross-encoder/nli-MiniLM2-L6-H768', device=device)
classifier('warm up', ['a', 'b', 'c'])

class ClassifyRequest(BaseModel):
    text: str
    candidate_labels: list[str]

@router.post("/classify")
def classify_text(item: ClassifyRequest) -> str:
    result = classifier(item.text, item.candidate_labels)
    return result['labels'][0]
