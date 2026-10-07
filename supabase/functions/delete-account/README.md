# Delete account Edge Function

This source candidate is not deployed. The Deno entry imports the pinned `npm:@supabase/supabase-js@2.117.2`. The reusable Web API handler rejects non-POST methods, query selectors, malformed Bearer headers, and any request stream before authentication or administrative work.

The only account ID comes from a successful online `auth.getUser(accessToken)` call. The service-role client is created only inside the server entry, with session persistence and token refresh disabled. It calls `auth.admin.deleteUser(verifiedUserId, false)` exactly once. A 200 acknowledgement is emitted only for the installed SDK's checked success shape `{ user: {} }`; ambiguous outcomes remain unknown and must not be retried automatically.

Run the repository's dedicated handler typecheck for the strict injected handler. Deno is not installed in the current local environment, so the entry's Deno runtime/typecheck and the hosted Edge Function remain unverified. No live account has been used, and this function has not been deployed.
