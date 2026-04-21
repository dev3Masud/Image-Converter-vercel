# Image Converter Web App

A modern, fast, browser-based image format converter with resize, quality control, bulk upload, and dark mode. Built with Python (Flask + Pillow) backend and vanilla JavaScript frontend.

## Features

- **Multi-format support**: PNG, JPG, WEBP, GIF, BMP, ICO, TIFF
- **Bulk conversion**: Upload and convert multiple images at once
- **Quality control**: Adjustable quality slider for JPG and WEBP
- **Image resize**: Optional width/height with aspect ratio lock
- **Dark mode**: Toggle with localStorage persistence
- **Drag & drop**: Intuitive file upload interface
- **Responsive**: Works on mobile, tablet, and desktop
- **Fast**: Serverless Python runtime on Vercel

## Tech Stack

- **Backend**: Python 3.9+, Flask, Pillow
- **Frontend**: HTML5, Tailwind CSS (CDN), Vanilla JS
- **Deployment**: Vercel (@vercel/python)
- **Local Dev**: Flask dev server

## Project Structure

```
image-converter/
├── api/
│   └── convert.py          # Vercel serverless function
├── templates/
│   └── index.html          # Single page app UI
├── app.py                  # Local Flask dev server
├── requirements.txt        # Python dependencies
├── vercel.json             # Vercel config
├── .vercelignore           # Deployment exclusions
└── README.md               # This file
```

## Local Development

### Prerequisites

- Python 3.9 or higher
- pip

### Setup

1. Clone or download this project:
```bash
cd image-converter
```

2. Create a virtual environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the dev server:
```bash
python app.py
```

5. Open your browser:
```
http://localhost:8080
```

## Deploy to Vercel

### Prerequisites

- Vercel account (free tier works)
- Vercel CLI installed: `npm i -g vercel`

### Deployment Steps

1. Navigate to project directory:
```bash
cd image-converter
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **image-converter** (or your choice)
- Directory? **./** (current directory)
- Override settings? **N**

4. Production deployment:
```bash
vercel --prod
```

Your app will be live at: `https://your-project.vercel.app`

## Usage

1. **Upload**: Drag & drop images or click to browse (max 10MB per file)
2. **Select format**: Choose output format from dropdown
3. **Adjust quality**: Use slider for JPG/WEBP (1-100)
4. **Resize (optional)**: Enable resize, enter dimensions, lock aspect ratio
5. **Convert**: Click "Convert" button
6. **Download**: Single file downloads directly, multiple files download as ZIP

## Limitations

- Max file size: 10MB per image
- Max execution time: 10 seconds (Vercel limit)
- Max response size: 4.5MB (Vercel limit)
- Bulk conversions with large files may hit limits

## Troubleshooting

### Local dev server won't start
- Check Python version: `python --version` (must be 3.9+)
- Reinstall dependencies: `pip install -r requirements.txt`
- Check port 8080 is not in use

### Vercel deployment fails
- Ensure `vercel.json` is present
- Check `requirements.txt` has correct versions
- Run `vercel logs` to see error details

### Image conversion fails
- Check file is valid image format
- Ensure file is under 10MB
- Try converting single file first

## License

MIT

## Author

Abdullah Al Masud
