FROM node:22-bookworm AS node

FROM php:8.3-cli-bookworm AS build

ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}

COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

RUN apt-get update \
    && apt-get install -y --no-install-recommends git libicu-dev libpq-dev libzip-dev unzip \
    && docker-php-ext-install bcmath intl pdo_pgsql zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --no-scripts \
    --optimize-autoloader

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN composer run-script post-autoload-dump \
    && npm run build \
    && rm -rf node_modules

FROM php:8.3-apache-bookworm AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends libicu-dev libpq-dev libzip-dev \
    && docker-php-ext-install bcmath intl opcache pdo_pgsql zip \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr

WORKDIR /var/www/html

COPY --from=build --chown=www-data:www-data /var/www/html /var/www/html
COPY docker/apache-vhost.conf /etc/apache2/sites-available/000-default.conf
COPY docker/start-render.sh /usr/local/bin/start-render

RUN chmod +x /usr/local/bin/start-render \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 10000

ENTRYPOINT ["start-render"]
CMD ["apache2-foreground"]
