from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import whisper
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import tempfile
import torch

app = FastAPI()

# Allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🧠 Load models once (on startup)
print("🔹 Loading Whisper model (base)...")
whisper_model = whisper.load_model("medium")

print("🔹 Loading Grammar correction model (Hugging Face)...")
grammar_model_name = "pszemraj/flan-t5-large-grammar-synthesis"
tokenizer = AutoTokenizer.from_pretrained(grammar_model_name)
grammar_model = AutoModelForSeq2SeqLM.from_pretrained(grammar_model_name)

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
        print("🟢 Transcription complete:", text)

        print("🪶 Correcting grammar...")
        input_text = f"correct the grammar and phrasing of this sentence: {text}"
        inputs = tokenizer(input_text, return_tensors="pt", truncation=True)

        with torch.no_grad():
            outputs = grammar_model.generate(**inputs, max_length=256)
            corrected_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

        print("✅ Correction complete:", corrected_text)

        return {"original": text, "corrected": corrected_text}

    except Exception as e:
        print("❌ Error:", e)
        return {"error": str(e)}
