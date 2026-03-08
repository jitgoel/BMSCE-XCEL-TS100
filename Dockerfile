# Use official lightweight Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Set env variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies from root to the container
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt
RUN pip install gunicorn redis

# Copy the backend code
COPY ./backend /app/backend

# Set the working directory to the backend so flask can find app.py easily
WORKDIR /app/backend

# Expose port
EXPOSE 5000

# Start Gunicorn server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "wsgi:app"]
