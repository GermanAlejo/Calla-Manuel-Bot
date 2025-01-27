
# Use the official Node.js 14 image as a base
FROM node:20

# Set the working directory to /bot
WORKDIR /bot

# Copy the package.json file into the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

RUN npm run build

# Copy the rest of the application code into the working directory
COPY . .

# Run the command to start the application when the container starts
CMD ["npm", "start"]