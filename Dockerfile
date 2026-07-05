# Use a lightweight Node.js Alpine base image
FROM node:20-alpine

# Install Docker CLI and Git for image builds and cloning repositories
RUN apk add --no-cache docker-cli git

# Create app directory
WORKDIR /app

# Copy package descriptors first to optimize caching
COPY package*.json ./

# Install all npm dependencies (including devDependencies required for typescript build)
RUN npm install

# Copy application files
COPY . .

# Run the build process which bundles frontend static files (Vite) and compiles the Express backend (server.ts)
RUN npm run build

# Prune dev dependencies to minimize container footprint
RUN npm prune --production

# Expose the application port
EXPOSE 3000

# Set production environment flags
ENV NODE_ENV=production
ENV PORT=3000

# Start the built fast-loading full-stack Express server
CMD ["npm", "run", "start"]
