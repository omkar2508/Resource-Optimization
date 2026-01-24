from flask import Flask, request, jsonify
from solver.timetable_solver import solve_timetable
import os
import traceback


app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return {"status": "Scheduler running"}

@app.route("/generate", methods=["POST"])
def generate():
    try:
        payload = request.get_json()
        print("\n=== PAYLOAD RECEIVED ===")
        print(payload)

        result = solve_timetable(payload)
        print("\n=== SOLVER RESULT ===")
        print(result)

        return jsonify(result)

    except Exception as e:
        print("\n=== PYTHON ERROR ===")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 6000))
    app.run(host="0.0.0.0", port=port)
