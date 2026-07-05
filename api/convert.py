from flask import Flask, request, send_file, jsonify
from PIL import Image
import io
import zipfile
import pillow_heif
import pillow_avif

# Register HEIF opener with Pillow
pillow_heif.register_heif_opener()

app = Flask(__name__)

ALLOWED_FORMATS = {'PNG', 'JPEG', 'JPG', 'WEBP', 'BMP', 'ICO', 'TIFF', 'AVIF'}

def convert_image(file_data, output_format, quality, width, height):
    img = Image.open(io.BytesIO(file_data))
    
    # Handle transparent background when converting to JPEG/JPG
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        if output_format in ('JPEG', 'JPG'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            img = img.convert('RGBA')
            background.paste(img, mask=img.split()[3])
            img = background

    if output_format == 'JPG':
        output_format = 'JPEG'

    # Aspect ratio resizing
    if width and height:
        img = img.resize((width, height), Image.Resampling.LANCZOS)
    elif width or height:
        w, h = img.size
        if width:
            ratio = width / w
            img = img.resize((width, int(h * ratio)), Image.Resampling.LANCZOS)
        else:
            ratio = height / h
            img = img.resize((int(w * ratio), height), Image.Resampling.LANCZOS)

    output = io.BytesIO()
    save_kwargs = {'format': output_format}
    if output_format in ('JPEG', 'WEBP', 'AVIF') and quality:
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
            converted = convert_image(file.read(), output_format, quality, width, height)
            ext = output_format.lower() if output_format != 'JPEG' else 'jpg'
            filename = f"{file.filename.rsplit('.', 1)[0]}_converted.{ext}"
            mimetype = 'image/jpeg' if output_format in ('JPEG', 'JPG') else f'image/{ext}'
            return send_file(converted, mimetype=mimetype, as_attachment=True, download_name=filename)
        
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file in files:
                converted = convert_image(file.read(), output_format, quality, width, height)
                ext = output_format.lower() if output_format != 'JPEG' else 'jpg'
                filename = f"{file.filename.rsplit('.', 1)[0]}_converted.{ext}"
                zip_file.writestr(filename, converted.getvalue())
        
        zip_buffer.seek(0)
        return send_file(zip_buffer, mimetype='application/zip', as_attachment=True, download_name='converted_images.zip')
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/exif', methods=['POST'])
def get_exif():
    try:
        files = request.files.getlist('files')
        if not files or not files[0].filename:
            return jsonify({'error': 'No files uploaded'}), 400
        
        file = files[0]
        img = Image.open(io.BytesIO(file.read()))
        
        exif_data = {}
        # Get EXIF tags
        if hasattr(img, '_getexif') and img._getexif():
            from PIL.ExifTags import TAGS
            for tag, value in img._getexif().items():
                decoded = TAGS.get(tag, tag)
                if isinstance(value, bytes):
                    try:
                        value = value.decode('utf-8', errors='ignore')
                    except Exception:
                        value = str(value)
                # Keep value JSON serializable
                if type(value) not in (str, int, float, bool, list, dict) and value is not None:
                    value = str(value)
                exif_data[decoded] = value
        
        # Add basic file details
        info = {
            'Filename': file.filename,
            'Format': img.format,
            'Mode': img.mode,
            'Size': f"{img.width} x {img.height} px",
            'Width': img.width,
            'Height': img.height,
        }
        if exif_data:
            info['EXIF'] = exif_data
            
        return jsonify(info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
