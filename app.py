from flask import Flask, render_template, request, jsonify, send_file
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration
from googletrans import Translator
from gtts import gTTS
import os

app = Flask(__name__)

# Ensure the audio directory exists (moved outside for WSGI compatibility)
os.makedirs('static/audio', exist_ok=True)

# Load models
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
translator = Translator()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate_caption', methods=['POST'])
def generate_caption():
    if 'image' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['image']
    lang = request.form.get('lang', 'en')

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        image = Image.open(file.stream)
        inputs = processor(images=image, return_tensors="pt")
        out = model.generate(**inputs)
        caption_en = processor.decode(out[0], skip_special_tokens=True)

        if lang != 'en':
            caption_translated = translator.translate(caption_en, dest=lang).text
        else:
            caption_translated = caption_en

        # Generate speech from the caption
        tts = gTTS(caption_translated, lang=lang)
        audio_filename = 'static/audio/caption.mp3'
        tts.save(audio_filename)

        return jsonify({
            "caption_translated": caption_translated,
            "audio_url": f"/static/audio/caption.mp3"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
