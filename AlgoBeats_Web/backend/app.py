from flask import Flask, jsonify, request, send_from_directory
from pathlib import Path
import subprocess
import os

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"
ENGINE_DIR = ROOT / "dsa_engine"
ENGINE = ENGINE_DIR / ("algobeats.exe" if os.name == "nt" else "algobeats")

app = Flask(__name__, static_folder=str(FRONTEND), static_url_path="")

def run_engine(command: str):
    if not ENGINE.exists():
        return {"ok": False, "error": "C engine not found. Compile dsa_engine/algobeats.c first."}, 500
    try:
        result = subprocess.run(
            [str(ENGINE)], input=command + "\n", text=True,
            capture_output=True, timeout=3, cwd=str(ROOT), check=False
        )
        if result.returncode != 0:
            return {"ok": False, "error": result.stderr or "C engine failed"}, 500
        import json
        data = json.loads(result.stdout)
        return data, 200
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": "C engine timed out"}, 504
    except Exception as exc:
        return {"ok": False, "error": str(exc)}, 500

@app.get("/")
def index():
    return send_from_directory(FRONTEND, "index.html")

@app.get("/api/catalog")
def catalog():
    data, status = run_engine("catalog")
    return jsonify(data), status

@app.post("/api/search")
def search():
    body = request.get_json(silent=True) or {}
    try:
        song_id = int(body.get("id", 0))
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "Song ID must be a number"}), 400
    algorithm = body.get("algorithm", "linear")
    if algorithm not in ("linear", "binary"):
        return jsonify({"ok": False, "error": "Unknown search algorithm"}), 400
    data, status = run_engine(f"{algorithm}_search {song_id}")
    return jsonify(data), status

@app.get("/api/sort/<algorithm>")
def sort_songs(algorithm):
    mapping = {"merge": "merge_sort", "quick": "quick_sort"}
    if algorithm not in mapping:
        return jsonify({"ok": False, "error": "Use merge or quick"}), 400
    data, status = run_engine(mapping[algorithm])
    return jsonify(data), status

@app.get("/assets/<path:filename>")
def assets(filename):
    return send_from_directory(FRONTEND / "assets", filename)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")), debug=False)
