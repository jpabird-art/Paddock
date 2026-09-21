#!/bin/sh
# Optional container entrypoint. The Dockerfile's CMD does the same work;
# this exists for stacks that prefer an entrypoint script.
set -e

echo "==> Starting Paddock..."
exec npm start
