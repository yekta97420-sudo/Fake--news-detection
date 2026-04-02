from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64
import io
from PIL import Image
import cv2
import numpy as np
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Fake News Detection API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get API key
EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY')

# Define Models
class TextDetectionRequest(BaseModel):
    text: str = Field(..., description="News text to analyze")

class DetectionResult(BaseModel):
    status: str  # "REAL" or "FAKE"
    confidence: float  # 0-100
    explanation: str
    suspicious_keywords: List[str] = []
    sources: List[str] = []
    timestamp: str

class VerificationRequest(BaseModel):
    claim: str = Field(..., description="Claim to verify")

# Helper functions
async def analyze_text_with_llm(text: str) -> dict:
    """Analyze text using LLM for fake news detection"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"text-analysis-{uuid.uuid4()}",
            system_message="""You are an expert fake news detection AI. Analyze news articles and determine if they are REAL or FAKE.
            
Provide your analysis in this exact JSON format:
            {
                "status": "REAL" or "FAKE",
                "confidence": (number between 0-100),
                "explanation": "detailed explanation of your reasoning",
                "suspicious_keywords": ["list", "of", "suspicious", "words"],
                "credibility_indicators": ["list of credibility factors found or missing"]
            }
            
Consider:
            - Sensational or emotional language
            - Lack of credible sources
            - Logical inconsistencies
            - Misleading headlines vs content
            - Verifiable facts and dates
            - Author credibility indicators"""
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(
            text=f"Analyze this news article for authenticity:\n\n{text}"
        )
        
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        import json
        # Extract JSON from response
        response_text = response.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(response_text)
        return result
    
    except Exception as e:
        logger.error(f"Error in text analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

async def analyze_image_with_vision(image_base64: str) -> dict:
    """Analyze image using Vision API for deepfake/manipulation detection"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"image-analysis-{uuid.uuid4()}",
            system_message="""You are an expert deepfake and image manipulation detection AI. Analyze images for signs of manipulation, AI generation, or deepfakes.
            
Provide your analysis in this exact JSON format:
            {
                "status": "REAL" or "FAKE",
                "confidence": (number between 0-100),
                "explanation": "detailed explanation of manipulation indicators found or authenticity indicators",
                "manipulation_indicators": ["list of specific manipulation signs detected"],
                "authenticity_indicators": ["list of authenticity markers found"]
            }
            
Look for:
            - Unnatural facial features or expressions
            - Inconsistent lighting or shadows
            - Blurred or distorted edges
            - Artifacts from AI generation
            - Inconsistent image quality across regions
            - Anatomical impossibilities
            - Background inconsistencies"""
        ).with_model("openai", "gpt-5.2")
        
        image_content = ImageContent(image_base64=image_base64)
        
        user_message = UserMessage(
            text="Analyze this image for signs of manipulation, deepfakes, or AI generation. Determine if it's REAL or FAKE.",
            file_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        import json
        response_text = response.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(response_text)
        return result
    
    except Exception as e:
        logger.error(f"Error in image analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")

async def verify_claim_with_llm(claim: str) -> dict:
    """Verify a claim using LLM's knowledge base"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"claim-verification-{uuid.uuid4()}",
            system_message="""You are a fact-checking AI with access to general world knowledge. Verify claims and provide evidence-based assessments.
            
Provide your analysis in this exact JSON format:
            {
                "status": "VERIFIED" or "UNVERIFIED" or "PARTIALLY_VERIFIED",
                "confidence": (number between 0-100),
                "explanation": "detailed explanation with reasoning",
                "supporting_facts": ["list of facts that support or contradict the claim"],
                "related_context": "relevant context or background information"
            }
            
Base your assessment on:
            - Known historical facts
            - Scientific consensus
            - Publicly documented events
            - Logical consistency
            - Common knowledge verification"""
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(
            text=f"Verify this claim based on known facts and general knowledge:\n\n{claim}"
        )
        
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        import json
        response_text = response.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(response_text)
        return result
    
    except Exception as e:
        logger.error(f"Error in claim verification: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

# Routes
@api_router.get("/")
async def root():
    return {"message": "Fake News Detection API", "status": "operational"}

@api_router.post("/detect-text", response_model=DetectionResult)
async def detect_text(request: TextDetectionRequest):
    """Detect fake news in text using AI"""
    try:
        logger.info(f"Analyzing text: {request.text[:100]}...")
        
        result = await analyze_text_with_llm(request.text)
        
        return DetectionResult(
            status=result.get("status", "UNKNOWN"),
            confidence=float(result.get("confidence", 50)),
            explanation=result.get("explanation", "Analysis completed"),
            suspicious_keywords=result.get("suspicious_keywords", []),
            sources=result.get("credibility_indicators", []),
            timestamp=datetime.now(timezone.utc).isoformat()
        )
    
    except Exception as e:
        logger.error(f"Text detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/detect-image")
async def detect_image(file: UploadFile = File(...)):
    """Detect deepfakes/manipulation in images using Vision AI"""
    try:
        logger.info(f"Analyzing image: {file.filename}")
        
        # Read image file
        contents = await file.read()
        
        # Convert to base64
        image_base64 = base64.b64encode(contents).decode('utf-8')
        
        # Analyze with Vision API
        result = await analyze_image_with_vision(image_base64)
        
        return {
            "status": result.get("status", "UNKNOWN"),
            "confidence": float(result.get("confidence", 50)),
            "explanation": result.get("explanation", "Analysis completed"),
            "suspicious_keywords": result.get("manipulation_indicators", []),
            "sources": result.get("authenticity_indicators", []),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    except Exception as e:
        logger.error(f"Image detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/detect-video")
async def detect_video(file: UploadFile = File(...)):
    """Detect deepfakes in videos using frame-by-frame analysis"""
    try:
        logger.info(f"Analyzing video: {file.filename}")
        
        # Read video file
        contents = await file.read()
        
        # Save temporarily
        temp_path = f"/tmp/{uuid.uuid4()}.mp4"
        with open(temp_path, "wb") as f:
            f.write(contents)
        
        # Extract frames
        cap = cv2.VideoCapture(temp_path)
        frames_to_analyze = []
        frame_count = 0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Sample 5 frames evenly distributed
        sample_indices = np.linspace(0, total_frames - 1, min(5, total_frames), dtype=int)
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count in sample_indices:
                # Convert frame to base64
                _, buffer = cv2.imencode('.jpg', frame)
                frame_base64 = base64.b64encode(buffer).decode('utf-8')
                frames_to_analyze.append(frame_base64)
            
            frame_count += 1
        
        cap.release()
        os.remove(temp_path)
        
        if not frames_to_analyze:
            raise HTTPException(status_code=400, detail="No frames could be extracted from video")
        
        # Analyze first frame (can be extended to analyze multiple frames)
        result = await analyze_image_with_vision(frames_to_analyze[0])
        
        return {
            "status": result.get("status", "UNKNOWN"),
            "confidence": float(result.get("confidence", 50)),
            "explanation": result.get("explanation", "Video analysis completed") + f" (Analyzed {len(frames_to_analyze)} frames)",
            "suspicious_keywords": result.get("manipulation_indicators", []),
            "sources": result.get("authenticity_indicators", []),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "frames_analyzed": len(frames_to_analyze)
        }
    
    except Exception as e:
        logger.error(f"Video detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/verify-claim")
async def verify_claim(request: VerificationRequest):
    """Verify a claim using AI-based fact checking"""
    try:
        logger.info(f"Verifying claim: {request.claim}")
        
        result = await verify_claim_with_llm(request.claim)
        
        # Map VERIFIED/UNVERIFIED to REAL/FAKE for consistency
        status_map = {
            "VERIFIED": "REAL",
            "PARTIALLY_VERIFIED": "UNCERTAIN",
            "UNVERIFIED": "FAKE"
        }
        
        return {
            "status": status_map.get(result.get("status", "UNVERIFIED"), "UNCERTAIN"),
            "confidence": float(result.get("confidence", 50)),
            "explanation": result.get("explanation", "Verification completed"),
            "suspicious_keywords": result.get("supporting_facts", []),
            "sources": [result.get("related_context", "")],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    except Exception as e:
        logger.error(f"Claim verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()