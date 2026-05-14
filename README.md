# PDF Upload API

Backend service for uploading, storing, listing, and downloading PDF files using Node.js, TypeScript, and Docker.

## Stack

- Node.js
- TypeScript
- Express
- Multer
- Docker

## Project structure

```text
src/
  app.ts
  controllers.ts
  routes.ts
  server.ts
  storage.ts
  types.ts
tests/
uploads/
Dockerfile
docker-compose.yml
README.md
```

## Local setup

```bash
npm install
cp .env.example .env
```

Environment variables:

- `PORT` - HTTP port for the API, default `3000`
- `UPLOADS_DIR` - upload storage path; relative values are resolved from the project root, default `uploads`

## Run locally

```bash
npm run dev
```

The service starts at `http://localhost:3000`.

For a production build:

```bash
npm run build
npm start
```

## Run tests

```bash
npm test
```

## Run with Docker

Build and start:

```bash
docker compose up --build
```

The container exposes port `3000` and mounts `./uploads` to `/app/uploads`.
Docker Compose also reads `PORT` and `UPLOADS_DIR` from `.env`.

## API

### `POST /upload`

Upload one PDF file using `multipart/form-data` with field name `file`.

Example:

```bash
curl -X POST http://localhost:3000/upload \
  -F "file=@sample.pdf;type=application/pdf"
```

Windows PowerShell:

```powershell
curl.exe -X POST http://localhost:3000/upload `
  -F "file=@sample.pdf;type=application/pdf"
```

Successful response:

```json
{
  "id": "6f2b82e5-43f4-4ea0-8129-6f53cce457b2",
  "originalName": "sample.pdf"
}
```

### `GET /files`

Returns uploaded file metadata stored in memory.

Example:

```bash
curl http://localhost:3000/files
```

Successful response:

```json
[
  {
    "id": "6f2b82e5-43f4-4ea0-8129-6f53cce457b2",
    "name": "sample.pdf"
  }
]
```

### `GET /files/:id/download`

Downloads the stored PDF using the original file name.

Example:

```bash
curl -OJ http://localhost:3000/files/6f2b82e5-43f4-4ea0-8129-6f53cce457b2/download
```

## Validation and behavior

- Only `application/pdf` is accepted.
- Maximum file size is `10 MB`.
- Files are stored in local `uploads/`.
- Metadata is stored in memory only.
- File names on disk are generated as `${uuid}.pdf`.
- Metadata is not restored after restart.
- After a service restart, files may still exist on disk while `/files` returns an empty list.
