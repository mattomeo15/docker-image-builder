#!/bin/bash

echo "[INIT] Starting internal Docker-in-Docker Daemon..."

# Start the Docker daemon in the background and redirect logs
dockerd --host=unix:///var/run/docker.sock > /var/log/dockerd.log 2>&1 &

# Loop and wait until the docker socket file exists and is responsive
echo "[INIT] Waiting for Docker daemon to initialize..."
while ! docker info >/dev/null 2>&1; do
    echo "[INIT] Still waiting for internal Docker socket..."
    sleep 1
done

echo "[INIT] Internal Docker Daemon is fully up and running!"
echo "[INIT] Launching Node.js application server..."

# Start your Node.js application
exec node server.js
