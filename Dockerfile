FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript code
RUN npm run build

# Use non-root user for better security
USER node

# Set environment variables (these will be overridden by docker-compose)
ENV PORT=3000
ENV SEARXNG_URL=http://searxng:8080

# Expose the port the app runs on
EXPOSE 3000

CMD ["node", "dist/index.js"]
