FROM node:20-alpine
WORKDIR /app

# Install build dependencies required for better-sqlite3 native compilation
RUN apk add --no-cache sqlite python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
EXPOSE 3001
CMD ["node", "src/index.js"]