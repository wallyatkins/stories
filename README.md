# Video Stories

This project is a simple web application that allows users to record short video prompts and responses. It uses **Vite**, **React**, **Tailwind CSS**, and lightweight **PHP** scripts for the backend.

## Structure

- `api` – PHP endpoints for authentication and video uploads.
- `client` – Vite React application with Tailwind for styling.
- `uploads` – Directory where uploaded videos are stored.

## Getting Started

1. **Install dependencies** (requires Node):
   ```bash
   cd client && npm install
   ```
   This will install `@vitejs/plugin-react` alongside React and Tailwind.
2. **Run the client in development mode**:
   ```bash
   cd client
   npm run dev
   ```
   The built site will be output to `build/` when you run `npm run build`.
3. **Serve with PHP** (after building):
   ```bash
   php -S localhost:8000
   ```

   The PHP built-in server should be started from the project root so the `api/`
   endpoints are available.

Uploaded videos are stored in the `uploads/` directory alongside the PHP scripts.
Apache users should enable `.htaccess` so that HTTP requests are redirected to HTTPS and video files are served through `api/video` for authenticated sessions.

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

### PostgreSQL tables

Two tables are expected:

```
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  avatar TEXT
);

CREATE TABLE friends (
  user_id INTEGER NOT NULL REFERENCES users(id),
  friend_user_id INTEGER NOT NULL REFERENCES users(id)
);
```

Each row in `friends` defines a relationship from `user_id` to
`friend_user_id`. Insert rows in both directions for mutual friendships.

The schema above is stored in `database/init.sql`. Future changes will live in
numbered files under `database/migrations/`. Apply new migrations in order when
deploying updates so the database stays in sync with the application.

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
