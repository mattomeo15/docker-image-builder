# Use the official Docker-in-Docker image as the base
FROM docker:24.0-dind

# Install Node.js, npm, and bash
RUN apk add --no-cache nodejs npm bash

# Set the working directory
WORKDIR /app

# Copy dependency definitions first for caching efficiency
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Copy and make the startup script executable
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose your web app port
EXPOSE 3000

# Fire up the custom entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
