# Delete account Edge Function

The owner reports uploading this source as the function displayed as `delete-account`, whose actual URL slug is `swift-api`. Deployed source parity and account deletion have not been independently verified. The Deno entry imports the pinned `npm:@supabase/supabase-js@2.117.2`. The reusable Web API handler rejects non-POST methods, query selectors, malformed Bearer headers, and any request stream before authentication or administrative work.

The only account ID comes from a successful online `auth.getUser(accessToken)` call. The service-role client is created only inside the server entry, with session persistence and token refresh disabled. It calls `auth.admin.deleteUser(verifiedUserId, false)` exactly once. A 200 acknowledgement is emitted only for the installed SDK's checked success shape `{ user: {} }`; ambiguous outcomes remain unknown and must not be retried automatically.

Run the repository's dedicated handler typecheck for the strict injected handler. Deno is not installed in the current local environment, so the entry's Deno runtime/typecheck and the hosted Edge Function remain unverified. No live account has been used by this verification.

`supabase/config.toml` maps `functions.swift-api` to this directory’s `index.ts` and retains `verify_jwt=true`. A future explicit deployment must use `supabase functions deploy swift-api` from the repository root with Supabase CLI 1.215.0 or newer; the config entrypoint is relative to config.toml. The dashboard display name does not select the URL. Do not redeploy or disable gateway JWT verification to diagnose an unknown request without inspecting the intended environment first. Changing the route does not clear any existing pending marker.
