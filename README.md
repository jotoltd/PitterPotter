<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/cd42f6d2-3260-438b-b639-5fbd0880c83c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Set your Supabase credentials in [.env.local](.env.local):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Create the `gift_cards` table in your Supabase project by running [supabase/schema.sql](supabase/schema.sql) in the SQL Editor
5. Deploy the Supabase Edge Functions: `supabase functions deploy`
6. Optionally set `VITE_SENTRY_DSN` in your frontend environment to enable Sentry error tracking.
7. Set the following Edge Function secrets in the Supabase dashboard for booking confirmation emails:
   - `RESEND_API_KEY` — your Resend API key
   - `RESEND_FROM_EMAIL` — sender address (defaults to `bookings@pitterpotter.com`)
8. Run the app:
   `npm run dev`

## Testing

Run the test suite:
`npm test`
