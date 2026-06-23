FROM mcr.microsoft.com/playwright:v1.49.0-noble

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV ENV=dev

CMD ["npx", "playwright", "test", "--reporter=html"]
