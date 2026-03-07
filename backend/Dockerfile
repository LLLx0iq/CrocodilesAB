FROM python:3.11-slim

# Устанавливаем Node.js 24
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Создаем виртуальное окружение Python
RUN python -m venv /opt/venv

# Активируем venv и устанавливаем пакеты
COPY requirements.txt ./
RUN /opt/venv/bin/pip install --no-cache-dir pandas numpy scikit-learn joblib

# Добавляем venv в PATH для всех следующих команд
ENV PATH="/opt/venv/bin:$PATH"

# Копируем package файлы и устанавливаем Node.js зависимости
COPY package*.json ./
RUN npm install

# Копируем остальные файлы
COPY . .

# Создаем директории
RUN mkdir -p /app/uploads /app/uploads/temp /app/processed_results /app/models

EXPOSE 3001

# Проверяем, что Python из venv работает
RUN which python && python --version

# Запускаем сервер
CMD ["npm", "run", "dev"]