from flask import Flask, send_file
from api.convert import handler

app = Flask(__name__)

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/api/convert', methods=['POST'])
def convert():
    return handler()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
