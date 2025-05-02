const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const preview = document.getElementById('preview');

// Show preview
function showPreview(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    preview.src = e.target.result;
    preview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

// Handle drag & drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) {
    imageInput.files = e.dataTransfer.files;
    showPreview(file);
  }
});

// Handle clicking on dropzone
dropZone.addEventListener('click', () => {
  imageInput.click();
});

imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (file) showPreview(file);
  else preview.classList.add('hidden');
});

// Handle pasting image from clipboard
document.addEventListener('paste', (e) => {
  const items = e.clipboardData.items;
  for (const item of items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) {
        imageInput.files = new DataTransfer().files;
        showPreview(file);
        const dt = new DataTransfer();
        dt.items.add(file);
        imageInput.files = dt.files;
      }
    }
  }
});

// Handle submit
document.getElementById('uploadForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const formData = new FormData();
  const file = imageInput.files[0];
  const lang = document.getElementById('language').value;

  if (!file) return alert("Please select or drop an image.");

  formData.append('image', file);
  formData.append('lang', lang);

  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('captions').classList.add('hidden');

  try {
    const res = await fetch('/generate_caption', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    document.getElementById('loading').classList.add('hidden');

    if (data.error) {
      alert(data.error);
    } else {
      document.getElementById('caption_translated').innerText = data.caption_translated;
      const audio = document.getElementById('caption_audio');
      audio.src = data.audio_url;
      audio.classList.remove('hidden');
      audio.play();
      document.getElementById('captions').classList.remove('hidden');
    }
  } catch (err) {
    document.getElementById('loading').classList.add('hidden');
    alert("An error occurred.");
  }
});
