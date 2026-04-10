FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN NODE_ENV=development npm ci
COPY . .
RUN GENERATE_SOURCEMAP=false CI=false node node_modules/react-scripts/bin/react-scripts.js build

FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/build ./build
COPY server.js ./

EXPOSE 3002
CMD ["node", "server.js"]
