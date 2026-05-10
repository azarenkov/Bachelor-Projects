import os
import random
import sys
from datetime import datetime, timedelta, timezone

from elasticsearch import Elasticsearch, helpers

ES_URL = os.getenv("ES_URL", "http://localhost:9200")
INDEX = os.getenv("LOG_INDEX", "shop-api-logs")

START_REQUESTS_PER_DAY = 4_000
MONTHLY_GROWTH_RATE = 0.18
NOISE_AMPLITUDE = 0.10

ROUTES = ["/api/products", "/api/cart", "/api/checkout", "/api/orders", "/api/auth/login"]
STATUS_CODES = [200, 200, 200, 200, 200, 200, 201, 204, 400, 500]


def daily_volume(day_index: int) -> int:
    """Compound monthly growth + light random noise."""
    months_elapsed = day_index / 30.0
    base = START_REQUESTS_PER_DAY * ((1 + MONTHLY_GROWTH_RATE) ** months_elapsed)
    noise = 1 + random.uniform(-NOISE_AMPLITUDE, NOISE_AMPLITUDE)
    return max(1, int(base * noise))


def gen_actions(days: int):
    end = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    start = end - timedelta(days=days)
    rng = random.Random(42)

    for day in range(days):
        ts_day = start + timedelta(days=day)
        count = daily_volume(day)
        # Sample a small number of events per day to keep ES light, store rate in `count`
        # by writing one summary doc per day + a handful of synthetic individual events.
        yield {
            "_index": INDEX,
            "_source": {
                "@timestamp": ts_day.isoformat(),
                "kind": "daily_summary",
                "request_count": count,
            },
        }
        sample_size = min(50, max(5, count // 200))
        for _ in range(sample_size):
            offset = rng.randint(0, 86_400 - 1)
            yield {
                "_index": INDEX,
                "_source": {
                    "@timestamp": (ts_day + timedelta(seconds=offset)).isoformat(),
                    "kind": "request",
                    "route": rng.choice(ROUTES),
                    "status": rng.choice(STATUS_CODES),
                    "latency_ms": round(rng.uniform(15, 350), 2),
                },
            }


def main() -> int:
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 365
    es = Elasticsearch(ES_URL, request_timeout=30)
    if not es.ping():
        print(f"Elasticsearch at {ES_URL} is unreachable")
        return 1

    if es.indices.exists(index=INDEX):
        es.indices.delete(index=INDEX)
    es.indices.create(
        index=INDEX,
        mappings={
            "properties": {
                "@timestamp":     {"type": "date"},
                "kind":           {"type": "keyword"},
                "route":          {"type": "keyword"},
                "status":         {"type": "integer"},
                "latency_ms":     {"type": "float"},
                "request_count":  {"type": "long"},
            }
        },
    )

    ok, errs = helpers.bulk(es, gen_actions(days), stats_only=False, raise_on_error=False)
    print(f"Indexed docs: ok={ok} errors={len(errs) if isinstance(errs, list) else errs}")
    es.indices.refresh(index=INDEX)
    total = es.count(index=INDEX)["count"]
    print(f"Total docs in index '{INDEX}': {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
