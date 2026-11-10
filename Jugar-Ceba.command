#!/bin/zsh
# CEBA — El mundo de siete capas. Doble clic para jugar.
cd "$(dirname "$0")"
PORT=8231
lsof -tiTCP:$PORT -sTCP:LISTEN | xargs kill 2>/dev/null
node tools/serve.mjs $PORT &
SRV=$!
sleep 0.6
open "http://127.0.0.1:$PORT/"
echo "CEBA en http://127.0.0.1:$PORT/  (cierra esta ventana para parar)"
trap "kill $SRV 2>/dev/null" EXIT
wait $SRV
