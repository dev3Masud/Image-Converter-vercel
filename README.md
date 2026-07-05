# ⚡ ImageConverter

A state-of-the-art, lightning-fast online image conversion and compression platform. Built for serverless deployment on Vercel, featuring a premium dashboard UI, browser-side ZIP compilation, and multi-format processing capabilities.

## 🌟 Key Features

*   **Premium Interactive UI**: Highly refined responsive layouts, smooth dark/light mode state transitions, and card-based image carousels.
*   **Three Feature Tabs**:
    *   📁 **Converter**: Convert between multiple formats (including HEIC, AVIF, PNG, JPEG, WEBP, BMP, TIFF, ICO).
    *   🎛️ **Compressor**: Sliders for compression intensity, format control, and an iOS-style toggle switch for custom resize width/height limits.
    *   🔍 **EXIF Inspector**: Inspect camera properties, focal lengths, dates, and other metadata directly from selected images.
*   **Sequential Conversion**: Visual one-by-one conversion flow showing progress spinner overlays, auto-scrolling viewport focus, and animating striped loading bars.
*   **Smart In-Browser Packaging**: Combines bulk converted outputs client-side into a single ZIP using `JSZip`, bypassing Vercel's Serverless 4.5MB payload size limit.
*   **Zero-Storage Privacy**: All conversions are handled temporarily in memory on Vercel serverless functions—files are never saved or stored.

## 🛠️ Tech Stack

*   **Backend**: Python (Flask, Pillow, pillow-heif, pillow-avif-plugin)
*   **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS, JSZip
*   **Deployment**: Vercel Serverless (@vercel/python)

## 📂 Project Structure

```
├── api/
│   └── convert.py          # Serverless Python conversion endpoint
├── css/
│   └── style.css           # Custom scroll animation & progress styling
├── js/
│   └── app.js              # State engine, UI controller & client-side compression
├── index.html              # Core application interface
├── app.py                  # Local Python development server
├── requirements.txt        # Backend dependencies (Pillow, AVIF & HEIC support)
├── vercel.json             # Vercel deployment routes and runtime configuration
└── README.md               # Documentation
```

## 🚀 Local Development

### Prerequisites

- Python 3.9+ (Python 3.14 recommended)
- pip

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dev3Masud/Image-Converter-vercel.git
   cd Image-Converter-vercel
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Launch development server**:
   ```bash
   python app.py
   ```

5. **Open local application**:
   Open [http://localhost:8080](http://localhost:8080) in your browser.

## ☁️ Deploying to Vercel

The application is pre-configured for Vercel Serverless Functions.

1. **Vercel GitHub Integration**:
   - Go to [Vercel.com](https://vercel.com).
   - Import your repository and click **Deploy**.
   - Vercel will automatically read `vercel.json` and build the Python backend in your serverless functions directory.

2. **Deploying via Vercel CLI**:
   ```bash
   npm i -g vercel
   vercel --prod
   ```

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Created and maintained by [@dev3Masud](https://github.com/dev3Masud).
