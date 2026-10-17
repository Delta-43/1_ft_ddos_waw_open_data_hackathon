# Backend image: REST API and MCP server share it (compose picks the command).
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend

WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Code and the committed fixtures only. Secrets come from the environment, never the image.
COPY backend/app backend/app
COPY data/fixtures data/fixtures

# data/local holds the rebuildable SQLite store and the routing cache; compose mounts a volume there.
RUN useradd --system --uid 10001 --no-create-home app \
    && mkdir -p data/local \
    && chown -R app:app data/local
USER app

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=4)"

CMD ["python", "-m", "uvicorn", "app.main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000"]
