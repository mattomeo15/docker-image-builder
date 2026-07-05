#!/bin/bash
echo "[INIT] Starting internal Docker-in-Docker Daemon..."
dockerd --host=unix:///var/run/docker.sock > /dev/null 2>&1 &
echo "[INIT] Waiting for Docker daemon to initialize..."
while ! docker info >/dev/null 2>&1; do
    echo "[INIT] Still waiting for internal Docker socket..."
    sleep 1
done
echo "[INIT] Internal Docker Daemon is fully up and running!"
echo "[INIT] Launching TypeScript application server..."
exec tsx server.ts
