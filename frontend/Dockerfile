FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN apk update && apk add bash && \
    npm install

COPY . .

# Создаем .env файл с правильным URL для Docker
RUN echo "VITE_BACKEND_URL=http://backend:3001" > .env

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]