from flask import Flask, send_file, send_from_directory
from api.convert import handler, get_exif

app = Flask(__name__)

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/css/<path:path>')
def send_css(path):
    return send_from_directory('css', path)

@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('js', path)

@app.route('/favicon.png')
def send_favicon():
    return send_file('favicon.png')

@app.route('/api/convert', methods=['POST'])
def convert():
    return handler()

@app.route('/api/exif', methods=['POST'])
def exif():
    return get_exif()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
