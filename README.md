# Private Two-Person Chat

A simple mobile-first 1-to-1 chat using Supabase Auth + Postgres + Realtime.

## What this starter does
- Separate login accounts for the two authorized users.
- Only the two specified user UUIDs can read/send messages.
- Realtime messages.
- Read timestamp.
- Unread messages remain in the database.
- Mobile-friendly UI.

## Setup
1. Create a Supabase project.
2. In Authentication, create exactly two user accounts.
3. Copy each user's Auth UUID.
4. Open `supabase.sql`, replace USER_UUID_1 and USER_UUID_2 with those UUIDs.
5. Run the SQL in Supabase SQL Editor.
6. Get Project URL and anon/public key from Supabase project settings.
7. Put them in `app.js`:
   SUPABASE_URL = "..."
   SUPABASE_ANON_KEY = "..."
8. Open `index.html` through a web host (GitHub Pages, Netlify, Vercel, etc.).
9. Use the two accounts to log in.

## Important security notes
- NEVER put the Supabase `service_role` key in frontend code.
- The database Row Level Security policies are the real access control.
- Do not rely on hiding the URL.
- A browser cannot guarantee that a person with physical access to a phone will never discover the website, browser history, notifications, screenshots, or other device traces.
- This starter does not claim end-to-end encryption. For highly sensitive communication, a professionally audited end-to-end encrypted messenger is safer.

## Requested delete behavior
The requested rule is:
- If a message has NOT been read, keep it.
- If it has been read, it may be eligible for deletion when the chat/session is closed.

For safety and reliability, this starter does not delete messages from the browser on close. A later server-side cleanup function can implement a precise retention policy, such as deleting a message only after both accounts have read it and a defined retention period has passed.
