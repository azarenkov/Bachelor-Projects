FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        python3 \
        python3-apt \
        ca-certificates \
        tzdata \
    && rm -rf /var/lib/apt/lists/*

CMD ["sleep", "infinity"]
