FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN mkdir -p logs

FROM base AS production
ENV NODE_ENV=production
EXPOSE 5000
USER node
CMD ["node", "src/server.js"]

FROM base AS development
RUN npm install --only=development
ENV NODE_ENV=development
EXPOSE 5000
CMD ["npm", "run", "dev"]
