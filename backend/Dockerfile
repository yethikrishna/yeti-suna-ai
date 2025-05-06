FROM python:3.11-slim

WORKDIR /app

RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/logs && \
    chown -R appuser:appuser /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --chown=appuser:appuser requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8001

CMD ["gunicorn", "api:app", "--workers", "2", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8001", "--timeout", "600", "--graceful-timeout", "300", "--keep-alive", "250", "--log-level", "info"]