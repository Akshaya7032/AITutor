from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import whisper
import tempfile
import requests

app = FastAPI()

# Allow frontend CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper model
print("🔹 Loading Whisper model (medium)...")
whisper_model = whisper.load_model("medium")


LT_API_URL = "https://api.languagetool.org/v2/check"
LT_API_KEY = "" 

def correct_grammar_langtool(text: str, language: str) -> str:
    """
    Correct grammar using LanguageTool API.
    Supports 30+ languages (e.g., 'en-US', 'es', 'fr', 'de').
    """
    if not text.strip():
        return text
    
    params = {
        "text": text,
        "language": language,  # e.g., 'en-US' for English, 'es' for Spanish
    }
    if LT_API_KEY and LT_API_KEY != "":
        params["access_token"] = LT_API_KEY
    
    try:
        response = requests.post(LT_API_URL, data=params)
        response.raise_for_status()
        data = response.json()
        
        # Reconstruct corrected text
        corrected = text
        replacements = data.get("matches", [])
        offset = 0
        for match in sorted(replacements, key=lambda m: m["offset"], reverse=True):
            start = match["offset"] + offset
            end = start + match["length"]
            replacement = match["replacements"][0]["value"] if match.get("replacements") else match.get("message", "")
            corrected = corrected[:start] + replacement + corrected[end:]
            offset += len(replacement) - match["length"]
        
        return corrected.strip()
    except Exception as e:
        print(f"❌ LanguageTool error: {e}")
        return text  # Fallback to original

@app.post("/transcribe/")
async def transcribe_audio(file: UploadFile):
    try:
        print("🟢 Received:", file.filename)

        # Save audio temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            temp_audio.write(await file.read())
            temp_audio_path = temp_audio.name

        print("🎙️ Transcribing with Whisper...")
        result = whisper_model.transcribe(temp_audio_path)
        text = result["text"].strip()
        language = result["language"]
        print(f"🟢 Transcription complete: {text} (Language: {language})")

        # Apply grammar correction for any supported language
        print("🪶 Correcting grammar with LanguageTool...")
        corrected_text = correct_grammar_langtool(text, f"{language}-US" if language == "en" else language)
        print("✅ Correction complete:", corrected_text)
        
        return {
            "original": text,
            "corrected": corrected_text,
            "language": language,
            "grammar_corrected": bool(corrected_text != text)  # True if corrections were made
        }
    
    except Exception as e:
        print("❌ Error:", e)
        return {"error": str(e)}