from flask import Flask, render_template, jsonify
import json

app = Flask(__name__)


def load_companies():
    with open('companies.json', 'r') as file:
        return json.load(file)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/companies')
def get_companies():
    companies = load_companies()
    return jsonify(companies)


if __name__ == '__main__':
    app.run(debug=True)
