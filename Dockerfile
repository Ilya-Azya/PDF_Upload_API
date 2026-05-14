FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

RUN mkdir -p uploads

EXPOSE 3000

CMD ["npm", "start"]
