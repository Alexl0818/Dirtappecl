# SoilConnect — single-service container. Builds the React frontend and serves
# it together with the Express API from one process on one port.

FROM node:20-alpine

WORKDIR /app

# Install deps first (better layer caching).
COPY package*.json ./
RUN npm install

# Copy source and build the frontend bundle into dist/.
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3001
# Persist the JSON store on a mounted volume so data survives restarts/redeploys.
ENV DATA_DIR=/app/data

EXPOSE 3001

CMD ["node", "server.js"]
