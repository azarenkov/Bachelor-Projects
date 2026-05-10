import math
import os
import socket
import time
from flask import Flask, jsonify, request

app = Flask(__name__)


@app.route("/")
def index():
    return jsonify(
        message="Hello from k8s-shop-api",
        hostname=socket.gethostname(),
        pod_ip=os.getenv("POD_IP", "unknown"),
        version=os.getenv("APP_VERSION", "v1"),
    )


@app.route("/healthz")
def healthz():
    return "ok", 200


@app.route("/work")
def work():
    iterations = int(request.args.get("iters", 200_000))
    started = time.time()
    acc = 0.0
    for i in range(1, iterations + 1):
        acc += math.sqrt(i) * math.log1p(i)
    return jsonify(
        hostname=socket.gethostname(),
        iterations=iterations,
        result=acc,
        elapsed_ms=round((time.time() - started) * 1000, 2),
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, threaded=True)
