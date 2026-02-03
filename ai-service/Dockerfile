FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Ensure pip is up-to-date and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Set NLTK data directory (so downloads go to /app/nltk_data)
ENV NLTK_DATA=/app/nltk_data

# Download NLTK (into /app/nltk_data)
RUN python -c "import nltk, os; os.makedirs(os.environ.get('NLTK_DATA','/app/nltk_data'), exist_ok=True); nltk.data.path.append(os.environ.get('NLTK_DATA')); nltk.download('vader_lexicon', download_dir=os.environ.get('NLTK_DATA'), quiet=True); nltk.download('punkt', download_dir=os.environ.get('NLTK_DATA'), quiet=True)"

# Copy source code
COPY . .

# Create directories for models and nltk_data (if not already present)
RUN mkdir -p /app/models /app/nltk_data

# PORT
EXPOSE 8000

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request, sys; urllib.request.urlopen('http://localhost:8000/health').read()" || exit 1

# Run app when container starts (do NOT start server during build)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]