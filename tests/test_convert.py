import io
from PIL import Image
from api.convert import app

def make_png() -> io.BytesIO:
    buffer = io.BytesIO()
    Image.new("RGBA", (2, 2), color=(255, 0, 0, 128)).save(buffer, format="PNG")
    buffer.seek(0)
    return buffer

def test_single_jpeg_download_uses_standard_mimetype():
    app.config["TESTING"] = True

    with app.test_client() as client:
        response = client.post(
            "/api/convert",
            data={
                "files": (make_png(), "sample.png"),
                "format": "JPEG",
                "quality": "85",
            },
            content_type="multipart/form-data",
        )

    assert response.status_code == 200
    assert response.mimetype == "image/jpeg"
    assert response.headers["Content-Disposition"].startswith("attachment;")

    converted = Image.open(io.BytesIO(response.data))
    assert converted.format == "JPEG"
