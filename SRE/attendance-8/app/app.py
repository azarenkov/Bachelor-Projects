import os
import socket
from flask import Flask, jsonify

app = Flask(__name__)


@app.route("/")
def index():
    return jsonify(
        message="Hello from k8s-demo-app",
        hostname=socket.gethostname(),
        pod_ip=os.getenv("POD_IP", "unknown"),
        version=os.getenv("APP_VERSION", "v1"),
    )


@app.route("/healthz")
def healthz():
    return "ok", 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
