# iKnow

iKnow is a YouTube learning-course organizer built with React and Vite.

## Included in this frontend

- Dashboard with course, lesson, and completion statistics
- YouTube playlist import, including playlist title, video title, channel, duration, and thumbnails
- Add individual YouTube videos by URL, with duplicate protection
- Embedded YouTube player
- Lesson completion tracking
- Drag-and-drop lesson ordering
- Bulk lesson selection, completion, and removal
- Undo for individual and bulk lesson removal
- Course categories, category filtering, search, and sorting
- Responsive dark interface
- Browser storage now, backend-ready data adapter for later

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env`.
3. Add your YouTube Data API v3 key to `VITE_YOUTUBE_API_KEY`.
4. Leave `VITE_API_BASE_URL` empty while using local browser storage.
5. Run:

   ```bash
   npm install
   npm run dev
   ```

6. Open the local URL printed by Vite.

Your courses are saved in this browser under the `iknow-courses` localStorage key. Keep using the same browser and local origin to retain that local data.

## Connect a backend later

The frontend already has a storage adapter at `src/lib/data.js`. To switch to a backend:

1. Implement the API contract below.
2. Set `VITE_API_BASE_URL` in `.env` to the backend origin, for example `http://localhost:3000`.
3. Restart the Vite development server.

When the API base URL is configured, iKnow loads the course collection from the backend at startup and sends changes to it automatically. Browser localStorage remains a local backup. If the backend cannot be reached at startup, the app stays in local mode and shows an Offline status rather than overwriting backend data.

### Required API contract

`GET /api/courses`

Response:

```json
{
  "courses": [
    {
      "id": "course-id",
      "title": "React fundamentals",
      "category": "Programming",
      "creator": "Imported from YouTube",
      "color": "violet",
      "createdAt": 1790000000000,
      "videos": [
        {
          "id": "video-id",
          "title": "React introduction",
          "channel": "Example channel",
          "duration": "12:34",
          "youtubeId": "abcdefghijk",
          "done": false,
          "thumbnail": "https://example.com/thumbnail.jpg"
        }
      ]
    }
  ]
}
```

`PUT /api/courses`

Request body:

```json
{
  "courses": []
}
```

The backend should validate the payload, save the complete course collection for the authenticated user, and return a success status (200 or 204). A JSON response is optional. The frontend sends cookies with requests (`credentials: include`), so a cookie/session-based backend can be connected without changing the data adapter.

Important backend requirements:

- Scope every read and write to the signed-in user. Never let one user read or overwrite another user's courses.
- Validate course and video fields and enforce reasonable request-size limits.
- Use HTTPS in production.
- Configure CORS for the exact frontend origin and allow credentials if frontend and API use different origins.
- Do not trust a user ID sent in the request body. Derive identity from the authenticated session.
- Consider versioning or conflict handling if multiple devices can edit the same collection simultaneously.

The current frontend does not include sign-in/sign-up screens. Add authentication when the backend is introduced if the app will have multiple users.

## YouTube API key note

`VITE_YOUTUBE_API_KEY` is included in browser requests and is therefore visible to users. Restrict it in Google Cloud to the YouTube Data API v3 and your allowed website origins. For a production deployment, proxy YouTube API requests through your backend if you need to keep credentials private.

## Build for deployment

```bash
npm run build
npm run preview
```

The production files are generated in `dist/`.

GitHub Pages is deployed from the `main` branch by the `Deploy to GitHub Pages` workflow. Push changes to `main` (or run the workflow manually) to build and publish `dist/`.
