import os
from datetime import datetime, timezone

import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import numpy as np
from elasticsearch import Elasticsearch

ES_URL = os.getenv("ES_URL", "http://localhost:9200")
INDEX = os.getenv("LOG_INDEX", "shop-api-logs")
HORIZON_MONTHS = 6
OUT_PATH = os.getenv("FORECAST_OUT", "../images/forecast.png")


def fetch_monthly_totals(es: Elasticsearch) -> tuple[list[datetime], list[float]]:
    body = {
        "size": 0,
        "query": {"term": {"kind": "daily_summary"}},
        "aggs": {
            "monthly": {
                "date_histogram": {
                    "field": "@timestamp",
                    "calendar_interval": "month",
                    "min_doc_count": 1,
                },
                "aggs": {"total": {"sum": {"field": "request_count"}}},
            }
        },
    }
    resp = es.search(index=INDEX, body=body)
    buckets = resp["aggregations"]["monthly"]["buckets"]
    months = [datetime.fromtimestamp(b["key"] / 1000.0, tz=timezone.utc) for b in buckets]
    totals = [float(b["total"]["value"]) for b in buckets]
    return months, totals


def average_monthly_growth(totals: list[float]) -> float:
    if len(totals) < 2:
        return 0.0
    rates = [(b - a) / a for a, b in zip(totals[:-1], totals[1:]) if a > 0]
    return float(np.mean(rates)) if rates else 0.0


def forecast(totals: list[float], rate: float, horizon: int) -> list[float]:
    last = totals[-1]
    out = []
    for k in range(1, horizon + 1):
        out.append(last * ((1 + rate) ** k))
    return out


def add_months(dt: datetime, n: int) -> datetime:
    month = dt.month - 1 + n
    year = dt.year + month // 12
    month = month % 12 + 1
    return dt.replace(year=year, month=month, day=1)


def main() -> int:
    es = Elasticsearch(ES_URL, request_timeout=30)
    if not es.ping():
        print(f"Elasticsearch at {ES_URL} is unreachable")
        return 1

    months, totals = fetch_monthly_totals(es)
    if len(totals) < 2:
        print("Not enough monthly data points to forecast")
        return 2

    rate = average_monthly_growth(totals)
    forecast_values = forecast(totals, rate, HORIZON_MONTHS)
    forecast_months = [add_months(months[-1], k) for k in range(1, HORIZON_MONTHS + 1)]

    print(f"Historical months   : {len(months)}")
    print(f"Avg monthly growth  : {rate * 100:.2f}%")
    print(f"Last historical mo. : {months[-1].strftime('%Y-%m')} -> {totals[-1]:,.0f} req")
    print()
    print(f"{'Month':<12} {'Forecast (req)':>18}")
    print("-" * 32)
    for m, v in zip(forecast_months, forecast_values):
        print(f"{m.strftime('%Y-%m'):<12} {v:>18,.0f}")

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(months, totals, marker="o", linewidth=2, label="Historical (ES)")
    ax.plot(
        forecast_months,
        forecast_values,
        marker="s",
        linestyle="--",
        linewidth=2,
        color="#ef4444",
        label=f"Forecast (+6 mo, growth={rate * 100:.1f}%/mo)",
    )
    ax.fill_between(
        forecast_months,
        [v * 0.9 for v in forecast_values],
        [v * 1.1 for v in forecast_values],
        color="#ef4444",
        alpha=0.15,
        label="±10% confidence band",
    )
    ax.set_title("Shop API — monthly traffic growth & 6-month forecast")
    ax.set_ylabel("Requests / month")
    ax.set_xlabel("Month")
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m"))
    ax.grid(True, alpha=0.3)
    ax.legend(loc="upper left")
    fig.autofmt_xdate()
    fig.tight_layout()

    out_path = os.path.abspath(OUT_PATH)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    fig.savefig(out_path, dpi=140)
    print(f"\nChart saved: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
