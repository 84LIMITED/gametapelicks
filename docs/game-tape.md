# Game Tape: adding a video clip

Each clip is one file in `src/tape/`. The file name becomes the URL (`/tape/<file-name>/`).

1. Copy an existing clip file and rename it.
2. Fill in the video:
   - YouTube: `"video": { "type": "youtube", "id": "VIDEO_ID", "start": 0 }`
   - Your own file: put it in `src/assets/tape/` and use `"video": { "type": "file", "src": "/assets/tape/name.mp4", "poster": "/assets/tape/name.jpg", "uploadDate": "2026-11-23" }`. For long footage, upload it to YouTube as unlisted and use the YouTube form. It loads faster and keeps the repo small.
3. Set `"lesson"` to the lesson folder name. The clip links to that lesson and the lesson links back.
4. Replace every `[confirm]` and every `0:00` in `watchFor` with a timestamp you checked by ear. Then delete the line `"draft": true`.
5. Run `npm test`, then commit and push.

Clips with `"draft": true` stay off the live site. Preview them with `node scripts/build.mjs --drafts`.

## Rights
Embed official uploads from the artist or label and add your own commentary. Host a file yourself only when you shot it. Keep the `credit` line.

## Voice
Same rules as the lessons: no em dashes, no "not X, it's Y" constructions, short sentences. The tests check both.

## Still to confirm
- That the Hot Tea upload is on the Goose channel.
- That the Key to the Highway video is the official Eric Clapton upload. Other 24 Nights candidates: Worried Life Blues (video gBgb-xnUckc). From Cream at Royal Albert Hall 2005, Crossroads is video _SWQQkrfgvA (upload source unconfirmed).
