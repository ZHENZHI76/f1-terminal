# Use Python 3.10 slim as the base image to reduce footprint
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies required for SciPy / Polars C-extensions if binary wheels miss
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend project
COPY . .

# Expose the API port
EXPOSE 8000

# Start Uvicorn with multiple workers for concurrent quant computation
# Host is set to 0.0.0.0 to allow internal Docker routing
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
