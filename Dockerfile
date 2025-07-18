# Stage 1: Build the React frontend and assemble the application
FROM node:20 AS builder
WORKDIR /app

# Copy and install frontend dependencies first to leverage Docker layer caching
COPY client/package*.json ./client/
RUN npm install --prefix client

# Copy ALL application source code. A change in any of these files
# will invalidate the cache for the build step below.
COPY client/ ./client/
COPY api/ ./api/
COPY uploads/ ./uploads/
COPY metadata/ ./metadata/
COPY logs/ ./logs/
COPY config.php .htaccess ./

# Build the frontend. This now runs whenever any source file changes.
RUN npm run build --prefix client

# Assemble the final application artifact in the 'build' directory,
# just like the GitHub deploy action.
RUN cp -r api/ build/api
RUN cp -r uploads/ build/uploads
RUN cp -r metadata/ build/metadata
RUN cp -r logs/ build/logs
RUN cp config.php .htaccess build/

# Stage 2: Create the final production image
FROM php:8.2-apache

# Install system dependencies required for PHP extensions and Composer
RUN apt-get update && apt-get install -y libpq-dev git unzip \
    && docker-php-ext-install pdo pdo_pgsql

# Enable Apache's rewrite module for .htaccess support
RUN a2enmod rewrite

# Install Composer
COPY --from=composer:lts /usr/bin/composer /usr/bin/composer

# Set the working directory for the final application
WORKDIR /var/www/html

# Copy Composer files and install PHP dependencies
COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-dev --optimize-autoloader

# Copy the fully assembled application from the builder stage into
# Apache's document root.
COPY --from=builder /app/build .

# Grant the web server user ownership of directories it needs to write to.
RUN chown -R www-data:www-data /var/www/html/metadata /var/www/html/uploads /var/www/html/logs