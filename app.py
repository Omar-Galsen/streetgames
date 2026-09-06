from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/games/<game_name>/")
def game(game_name):
    game_dir = os.path.join(app.root_path, "games", game_name)
    return send_from_directory(game_dir, "index.html")

@app.route("/games/<game_name>/<path:filename>")
def game_files(game_name, filename):
    game_dir = os.path.join(app.root_path, "games", game_name)
    return send_from_directory(game_dir, filename)

if __name__ == "__main__":
    app.run(debug=True)