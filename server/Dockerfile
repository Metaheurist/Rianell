FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt* ./
RUN pip install --no-cache-dir watchdog supabase 2>/dev/null || pip install --no-cache-dir watchdog
COPY . .
EXPOSE 8081
ENV PORT=8081
CMD ["python", "-m", "server"]
