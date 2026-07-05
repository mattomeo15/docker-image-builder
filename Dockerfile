FROM docker:24.0-dind

# Install Node.js, npm, and bash
RUN apk add --no-cache nodejs npm bash

# Switch the working directory to match the backend path exactly
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
RUN npm install

# Copy your source files into /app
COPY . .

# Ensure the workspace directory expected by the app exists inside the image
RUN mkdir -p /app/docker-workspace

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
