from flask import Flask, render_template
from api.convert import handler

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/convert', methods=['POST'])
def convert():
    return handler()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
