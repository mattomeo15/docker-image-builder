#!/bin/sh

# Start the Docker daemon in the background using VFS storage driver
# for reliability in containerized/unprivileged environments.
echo "Starting internal Docker daemon..."
dockerd --storage-driver=vfs --data-root=/var/lib/docker > /var/log/dockerd.log 2>&1 &

# Wait for Docker socket to appear
echo "Waiting for Docker daemon to become ready..."
TIMEOUT=30
while [ ! -S /var/run/docker.sock ]; do
  TIMEOUT=$((TIMEOUT - 1))
  if [ $TIMEOUT -le 0 ]; then
    echo "❌ ERROR: Docker daemon failed to start within 30 seconds."
    echo "=== Daemon Logs ==="
    cat /var/log/dockerd.log
    echo "==================="
    break
  fi
  sleep 1
done

if [ -S /var/run/docker.sock ]; then
  echo "✅ Docker daemon is up and running!"
  docker info || echo "Could not run 'docker info', but socket is present."
else
  echo "⚠️ Continuing boot process without active Docker socket."
fi

# Hand over to CMD
exec "$@"
