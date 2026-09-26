#!/bin/sh

set -eu

port="${PORT:-10000}"

sed -i "s/Listen 80/Listen ${port}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:10000>/<VirtualHost *:${port}>/" /etc/apache2/sites-available/000-default.conf

php artisan config:cache
php artisan migrate --force
php artisan view:cache

exec "$@"
