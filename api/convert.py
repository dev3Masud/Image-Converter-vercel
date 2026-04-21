from flask import Flask, request, send_file, jsonify
from PIL import Image
import io
import zipfile

app = Flask(__name__)

ALLOWED_FORMATS = {'PNG', 'JPEG', 'WEBP', 'GIF', 'BMP', 'ICO', 'TIFF'}
MAX_SIZE = 10 * 1024 * 1024
MAX_WIDTH = 3840
MAX_HEIGHT = 2160

def convert_image(file_data, output_format, quality, width, height):
    img = Image.open(io.BytesIO(file_data))
    if img.mode in ('RGBA', 'LA', 'P') and output_format == 'JPEG':
        img = img.convert('RGB')
    if width and height:
        img = img.resize((width, height), Image.Resampling.LANCZOS)
    output = io.BytesIO()
    save_kwargs = {'format': output_format}
    if output_format in ('JPEG', 'WEBP') and quality:
        save_kwargs['quality'] = quality
    img.save(output, **save_kwargs)
    output.seek(0)
    return output

@app.route('/api/convert', methods=['POST'])
def handler():
    try:
        files = request.files.getlist('files')
        if not files or not files[0].filename:
            return jsonify({'error': 'No files uploaded'}), 400
        
        output_format = request.form.get('format', 'PNG').upper()
        if output_format not in ALLOWED_FORMATS:
            return jsonify({'error': 'Invalid format'}), 400
        
        quality = int(request.form.get('quality', 85))
        width = int(request.form.get('width', 0)) or None
        height = int(request.form.get('height', 0)) or None
        
        if len(files) == 1:
            file = files[0]
            if len(file.read()) > MAX_SIZE:
                return jsonify({'error': 'File exceeds 10MB'}), 400
            file.seek(0)
            
            img = Image.open(io.BytesIO(file.read()))
            if img.width > MAX_WIDTH or img.height > MAX_HEIGHT:
                return jsonify({'error': f'Image resolution exceeds 4K limit ({MAX_WIDTH}x{MAX_HEIGHT})'}), 400
            file.seek(0)
            
            converted = convert_image(file.read(), output_format, quality, width, height)
            ext = output_format.lower() if output_format != 'JPEG' else 'jpg'
            filename = f"{file.filename.rsplit('.', 1)[0]}_converted.{ext}"
            
            return send_file(converted, mimetype=f'image/{ext}', as_attachment=True, download_name=filename)
        
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file in files:
                if len(file.read()) > MAX_SIZE:
                    continue
                file.seek(0)
                img = Image.open(io.BytesIO(file.read()))
                if img.width > MAX_WIDTH or img.height > MAX_HEIGHT:
                    continue
                file.seek(0)
                converted = convert_image(file.read(), output_format, quality, width, height)
                ext = output_format.lower() if output_format != 'JPEG' else 'jpg'
                filename = f"{file.filename.rsplit('.', 1)[0]}_converted.{ext}"
                zip_file.writestr(filename, converted.getvalue())
        
        zip_buffer.seek(0)
        return send_file(zip_buffer, mimetype='application/zip', as_attachment=True, download_name='converted_images.zip')
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
