FROM node:24-alpine

WORKDIR /app

# Копирование и установка зависимостей
COPY package.json .
RUN npm install

# Копирование исходного кода
COPY . .

# Сборка приложения (опционально, для production)
# RUN npm run build

# Открытие порта
EXPOSE 5173

# Запуск в режиме разработки
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]