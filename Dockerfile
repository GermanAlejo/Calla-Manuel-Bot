#Usa una imagen base de Node.js compatible con ARM (Raspberry Pi)
FROM node:20 AS builder

RUN apt-get update -y && apt-get install -y git

RUN echo "Install git..."

# Create a non-root user context
USER node
WORKDIR /home/node/calla-manuel-bot

#RUN git clone https://github.com/GermanAlejo/Calla-Manuel-Bot.git ./

# Copy package files and set ownership (already handled by WORKDIR)
COPY --chown=node:node package*.json ./

# Install dependencies as the non-root user
RUN npm install

# Copy the rest of the files with correct ownership
COPY --chown=node:node . .

# Build the project
RUN npm run build || echo "Warning: Build failed, but continuing..."

# Runtime command
CMD ["npm", "start"]

