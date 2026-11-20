# Build context is the repo root (see docker-compose.yml)
FROM node:22-slim AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY service/*.py ./
COPY --from=web /web/dist ./static
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
