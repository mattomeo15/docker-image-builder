FROM docker:24.0-dind
RUN apk add --no-cache nodejs npm bash
WORKDIR /app
COPY package*.json ./
RUN npm install && npm install -g tsx
COPY . .
RUN mkdir -p /app/docker-workspace
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
