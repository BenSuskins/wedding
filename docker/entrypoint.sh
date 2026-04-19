#!/bin/sh
set -eu

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] running prisma migrate deploy"
  node /app/prisma-cli/node_modules/prisma/build/index.js migrate deploy
fi

echo "[entrypoint] starting: $*"
exec "$@"
