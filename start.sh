#!/bin/ash

echo "Formatting Caddyfile..."
./caddy-server fmt --overwrite ./caddy/Caddyfile

# --------

# Stop processes if the script is stopping
cleanup() {
    echo "Stopping Caddy..."
    kill -SIGINT "$caddy_pid"
    wait "$caddy_pid"
}

trap cleanup SIGINT SIGTERM

echo "Starting PHP-FPM..."
PHP_FPM=$(find /usr/sbin -name "php-fpm*" -type f | tail -n 1)
$PHP_FPM --fpm-config /home/container/php-fpm/php-fpm.conf -c /home/container/php-fpm/ &

echo "Starting Caddy..."
./caddy-server run --watch --config ./caddy/Caddyfile &
caddy_pid=$!
wait "$php_fpm_pid"
wait "$caddy_pid"
