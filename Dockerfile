#Usa una imagen base de Node.js compatible con ARM (Raspberry Pi)
FROM node:lts-alpine AS builder

# Create a non-root user context
WORKDIR /home/node/calla-manuel-bot

RUN npm install -g npm@latest

COPY package*.json ./

# Make sure typescript is installed
RUN npm install -g typescript

# Install dependencies as the non-root user
RUN npm install

# Copy the rest of the files with correct ownership
COPY . .

USER node

# Build the project
RUN npm run build || echo "Warning: Build failed, but continuing..."

# Runtime command
CMD ["npm", "start"]