from fastapi import FastAPI, UploadFile, BackgroundTasks
from starlette.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import whisper
import tempfile
import requests
from TTS.api import TTS
import os
from pydub import AudioSegment
import torch

app = FastAPI()

# Allow frontend CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔹 Load Whisper model (large-v2 for high accuracy)
print("🔹 Loading Whisper model (large-v2)...")
whisper_model = whisper.load_model("large-v2")

# 🔹 Load Coqui TTS model (multi-lingual for broad language coverage)
print("🔹 Loading Coqui TTS model...")
tts_model = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2", progress_bar=True)

# 🔹 Path to a reference audio file for voice cloning
REFERENCE_SPEAKER_WAV = "C:/Users/bannu/OneDrive/Desktop/VJH2K25/backend/reference_en_female.wav"  # Update this path

# Verify that the reference audio file exists
if not os.path.exists(REFERENCE_SPEAKER_WAV):
    print(f"❌ Reference speaker WAV file not found at {REFERENCE_SPEAKER_WAV}. Using input audio as fallback.")

# 🔹 LanguageTool API for grammar correction
LT_API_URL = "https://api.languagetool.org/v2/check"
LT_API_KEY = ""  # Optional — free tier doesn’t need it

def correct_grammar_langtool(text: str, language: str) -> str:
    """
    Correct grammar using the LanguageTool public API.
    Supports multiple languages (e.g., 'en-US', 'es', 'fr', 'de').
    """
    if not text.strip():
        return text

    params = {"text": text, "language": language}
    if LT_API_KEY:
        params["access_token"] = LT_API_KEY

    try:
        response = requests.post(LT_API_URL, data=params)
        response.raise_for_status()
        data = response.json()

        corrected = text
        replacements = data.get("matches", [])
        offset = 0
        for match in sorted(replacements, key=lambda m: m["offset"], reverse=True):
            start = match["offset"] + offset
            end = start + match["length"]
            replacement = match["replacements"][0]["value"] if match.get("replacements") else ""
            corrected = corrected[:start] + replacement + corrected[end:]
            offset += len(replacement) - match["length"]

        return corrected.strip()
    except Exception as e:
        print(f"❌ LanguageTool error: {e}")
        return text

def convert_to_wav(input_path: str, output_path: str):
    """
    Convert input audio to WAV format (mono, 22050 Hz, 16-bit PCM).
    """
    try:
        audio = AudioSegment.from_file(input_path)
        print(f"Input audio: {input_path} - Channels: {audio.channels}, Sample Rate: {audio.frame_rate}, Sample Width: {audio.sample_width}")
        audio = audio.set_channels(1).set_frame_rate(22050).set_sample_width(2)  # Mono, 22050 Hz, 16-bit
        audio.export(output_path, format="wav")
        print(f"✅ Converted {input_path} to WAV at {output_path}")
        return True
    except Exception as e:
        print(f"❌ Error converting audio to WAV: {e}")
        return False

def cleanup_file(path: str):
    """Background task to delete a file after response is sent."""
    if path and os.path.exists(path):
        try:
            os.unlink(path)
            print(f"✅ Cleaned up {path}")
        except Exception as e:
            print(f"❌ Error cleaning up {path}: {e}")

@app.post("/transcribe/")
async def transcribe_audio(file: UploadFile, background_tasks: BackgroundTasks):
    temp_audio_path = None
    converted_audio_path = None
    tts_audio_path = None
    try:
        print(f"🟢 Received: {file.filename}")

        # Save uploaded audio temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
            temp_audio.write(await file.read())
            temp_audio_path = temp_audio.name

        # Convert input audio to WAV format for Whisper and TTS compatibility
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_converted_audio:
            converted_audio_path = temp_converted_audio.name
            if not convert_to_wav(temp_audio_path, converted_audio_path):
                raise ValueError("Failed to convert input audio to WAV format")

        # 🎙 Transcribe audio using Whisper
        print("🎙 Transcribing with Whisper...")
        result = whisper_model.transcribe(converted_audio_path)
        text = result["text"].strip()
        language = result["language"]
        print(f"✅ Transcription complete: '{text}' (Language: {language})")

        # ✍ Grammar correction
        print("🪶 Correcting grammar with LanguageTool...")
        corrected_text = correct_grammar_langtool(
            text, f"{language}-US" if language == "en" else language
        )
        print("✅ Correction complete:", corrected_text)

        # 🔈 Generate speech with Coqui TTS using reference speaker audio
        print("🔊 Synthesizing corrected text with Coqui TTS...")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_tts_audio:
            tts_audio_path = temp_tts_audio.name

            # Use detected language or fallback to English
            tts_language = "en" if language not in tts_model.languages else language
            # Use reference audio if available, else use converted input audio
            speaker_wav = REFERENCE_SPEAKER_WAV if os.path.exists(REFERENCE_SPEAKER_WAV) else converted_audio_path
            print(f"Using language: {tts_language} with speaker WAV: {speaker_wav}")

            # Verify speaker_wav format
            speaker_audio = AudioSegment.from_file(speaker_wav)
            print(f"Speaker WAV: {speaker_wav} - Channels: {speaker_audio.channels}, Sample Rate: {speaker_audio.frame_rate}, Sample Width: {speaker_audio.sample_width}")

            # Generate speech using reference audio for voice cloning
            wav = tts_model.tts(
                text=corrected_text,
                speaker_wav=speaker_wav,
                language=tts_language
            )
            tts_model.synthesizer.save_wav(wav, tts_audio_path)

        print("✅ TTS synthesis complete:", tts_audio_path)

        # Check if file exists before returning FileResponse
        if not os.path.exists(tts_audio_path):
            raise FileNotFoundError(f"Generated audio file not found at {tts_audio_path}")

        # Return the corrected audio + headers, defer cleanup
        return FileResponse(
            path=tts_audio_path,
            filename="corrected_audio.wav",
            media_type="audio/wav",
            headers={
                "X-Original-Text": text,
                "X-Corrected-Text": corrected_text,
                "X-Language": language,
                "X-Grammar-Corrected": str(corrected_text != text)
            },
            background=background_tasks.add_task(cleanup_file, tts_audio_path)
        )

    except Exception as e:
        print("❌ Error:", e)
        return {"error": str(e)}

    finally:
        # Cleanup temporary files except tts_audio_path (handled by background task)
        for path in [temp_audio_path, converted_audio_path]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                    print(f"✅ Cleaned up {path}")
                except Exception as e:
                    print(f"❌ Error cleaning up {path}: {e}")