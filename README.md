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
Apache users should enable `.htaccess` so that HTTP requests are redirected to HTTPS and video files are served through `api/video.php` for authenticated sessions.

## Login Flow

1. Users enter their email address in the login form.
2. A login link is emailed to them using the PHP backend.
3. Following the link establishes a session which allows access to the recorders.

## Recording Flow

1. Click **Record Prompt** to capture a prompt video.
2. After uploading, the prompt ID is displayed and you can record responses.
3. Responses are listed below the recorder.

This simple setup demonstrates recording and playback of user-generated videos for storytelling.

## Apache Configuration

An `.htaccess` file is included to enforce HTTPS and route requests for files in
`uploads/` through `api/video.php`. Make sure `AllowOverride` is enabled in your
Apache configuration so these rules take effect.

## Server Configuration

Server-side settings live in `config.php`. It reads environment variables and
optionally a `.env` file. Copy `.env.example` to `.env` in the project root (or
set `ENV_FILE` to another path) to configure settings without modifying the code
base. Environment variables `MAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS` and `SMTP_SECURE` define the email sender and SMTP credentials.

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
