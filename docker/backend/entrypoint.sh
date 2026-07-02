#!/usr/bin/env sh
set -eu

wait_for_postgres() {
  node <<'NODE'
const net = require('net');
const url = new URL(process.env.DATABASE_URL);
const host = url.hostname;
const port = Number(url.port || 5432);
const deadline = Date.now() + 90000;

function check() {
  const socket = net.createConnection({ host, port });
  socket.setTimeout(3000);
  socket.on('connect', () => {
    socket.end();
    process.exit(0);
  });
  socket.on('timeout', () => {
    socket.destroy();
    retry();
  });
  socket.on('error', retry);
}

function retry() {
  if (Date.now() > deadline) {
    console.error(`Postgres not reachable at ${host}:${port}`);
    process.exit(1);
  }
  setTimeout(check, 2000);
}

check();
NODE
}

wait_for_postgres
exec "$@"
