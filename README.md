# Video Stories

This project is a simple web application that allows users to record short video prompts and responses. It uses **Vite**, **React**, **Tailwind CSS**, and lightweight **PHP** scripts for the backend.

## Structure

- `api` – PHP endpoints for uploading and listing videos.
- `client` – Vite React application with Tailwind for styling.
- `uploads` – Directory where uploaded videos are stored.

## Getting Started

1. **Install dependencies** (requires Node):
   ```bash
   cd client && npm install
   ```
2. **Run the client in development mode**:
   ```bash
   cd client
   npm run dev
   ```
   The built site will be output to `build/` when you run `npm run build`.
3. **Serve with PHP** (after building):
   ```bash
   php -S localhost:8000 -t build
   ```

Uploaded videos are stored in the `uploads/` directory alongside the PHP scripts.

## Recording Flow

1. Click **Record Prompt** to capture a prompt video.
2. After uploading, the prompt ID is displayed and you can record responses.
3. Responses are listed below the recorder.

This simple setup demonstrates recording and playback of user-generated videos for storytelling.
