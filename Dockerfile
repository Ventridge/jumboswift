# Dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy src directory first
COPY src/ ./src/

# Copy remaining files
COPY . .

# Debug: List contents to verify files
RUN ls -la
RUN ls -la src/

EXPOSE 8000

# Update the path to point to src/server.js
CMD [ "node", "./src/server.js" ]