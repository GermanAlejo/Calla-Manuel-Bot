
# Use the official Node.js 14 image as a base
FROM node:14

# Set the working directory to /app
WORKDIR /app

# Copy the package.json file into the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

RUN npm run build

# Copy the rest of the application code into the working directory
COPY . .

# Run the command to start the application when the container starts
CMD ["npm", "start"]