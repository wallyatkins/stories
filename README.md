# Video Stories

This project is a simple web application that allows users to record short video prompts and responses. It uses **Vite**, **React**, **Tailwind CSS**, and lightweight **PHP** scripts for the backend.

## Structure

- `api` – PHP endpoints for authentication and video uploads.
- `client` – Vite React application with Tailwind for styling.
- `uploads` – Directory where uploaded videos are stored.

## Local Development Environment

This project uses **Docker** to create a local development environment that is an exact replica of the production build artifact. The entire application is built and served from within a self-contained Docker image, mirroring the deployment process.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)

### Setup and Running

1.  **Configure Environment**
    Copy the example environment file. This is used by the PHP application inside the container to connect to the database.
    ```bash
    cp .env.example .env
    ```

2.  **Build and Run the Application**
    Use Docker Compose to build the image and start the services. The `Dockerfile` handles all dependencies and build steps for both the frontend and backend.
    ```bash
    docker compose up -d --build
    ```

Your application is now running at **[http://localhost:8080](http://localhost:8080)**.

### Development Workflow

Because the application is fully built inside the Docker image, this setup does not support hot-reloading or live code changes.

**To see any changes to your code (frontend or backend), you must rebuild the image:**
```bash
docker compose up -d --build
```

### Stopping the Environment

When you are finished, stop the Docker containers:
```bash
docker compose down
```
Your PostgreSQL data is persisted in a Docker volume and will be available on the next start.


## Login Flow

1. Users enter their email address in the login form.
2. The backend checks the address against the whitelist stored in PostgreSQL.
   If it isn't found the request is rejected.
3. When recognised, the server emails a login link and stores any associated
   friend accounts with the token. The link is only valid for 15 minutes.
4. Following the link establishes a session which includes the user's friend
   list so it can be queried from the client. If the link has expired, the
   user is shown a form to request a new one.

## Recording Flow

1. Click **Record Prompt** to capture a prompt video.
2. After uploading, the prompt ID is displayed and you can record responses.
3. Responses are listed below the recorder.

This simple setup demonstrates recording and playback of user-generated videos for storytelling.

## Apache Configuration

An `.htaccess` file is included to enforce HTTPS and route requests for files in
`uploads/` through `api/video`. Make sure `AllowOverride` is enabled in your
Apache configuration so these rules take effect. The deployment workflow copies
both `.htaccess` and `config.php` to the host so these rules and settings are
applied automatically with each update.

## Server Configuration

Server-side settings live in `config.php`. It reads environment variables and
optionally a `.env` file. Copy `.env.example` to `.env` in the project root (or
set `ENV_FILE` to another path) to configure settings without modifying the code
base. Environment variables `MAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS` and `SMTP_SECURE` define the email sender and SMTP credentials.
`DB_DSN`, `DB_USER` and `DB_PASS` configure the PostgreSQL connection used for
whitelisted accounts and friend relationships.

### Database Migrations

The database schema is managed through SQL migration files located in the `database/migrations/` directory. When the Docker environment is started for the first time, it will automatically execute all scripts in this folder in sequential order to initialize the database.

## PHP Backend Setup

The PHP backend uses [Composer](https://getcomposer.org/) to manage dependencies. To install the required libraries, run the following commands from the project root:

1.  **Download Composer:**
    ```bash
    php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
    ```
2.  **Install Composer:**
    ```bash
    php composer-setup.php
    ```
3.  **Remove the installer:**
    ```bash
    php -r "unlink('composer-setup.php');"
    ```
4.  **Install dependencies:**
    ```bash
    php composer.phar install
    ```

This will create a `vendor` directory with the necessary libraries. Remember to run `php composer.phar install` on your hosting environment to ensure all dependencies are correctly installed.
