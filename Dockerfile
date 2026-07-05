FROM docker:24.0-dind

# Install Node.js, npm, and bash
RUN apk add --no-cache nodejs npm bash

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install project dependencies and global TypeScript execution engine
RUN npm install && npm install -g tsx

# Copy all source files
COPY . .

# Ensure workspace directory exists
RUN mkdir -p /app/docker-workspace

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
