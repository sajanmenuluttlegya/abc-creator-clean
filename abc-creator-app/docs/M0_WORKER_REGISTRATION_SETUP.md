# M0 worker URL registration

This stage lets a Kaggle M0 worker publish its temporary Cloudflare Quick Tunnel URL to the ABC Creator backend.

It intentionally does **not** change the existing text-to-image route yet. M0 request routing should be enabled only after registration is proven end-to-end.

## Files added

- `supabase/migrations/20260713_create_m0_worker_registry.sql`
- `lib/image-tools/m0-worker-registry.ts`
- `app/api/internal/m0/register/route.ts`
- `scripts/kaggle/m0-register-worker-cell.py`
- `.env.m0.example`

## Flow

1. Kaggle starts M0.
2. Cloudflare creates a new `https://...trycloudflare.com` URL.
3. The notebook sends the URL to `/api/internal/m0/register` with a bearer token.
4. ABC Creator validates the token, URL, worker name, expiry, and live `/health` response.
5. The server stores the active URL in Supabase using the service-role client.
6. Browser clients cannot read or write the registry table.

## 1. Apply the Supabase migration

Open the Supabase project used by ABC Creator.

1. Open **SQL Editor**.
2. Create a new query.
3. Copy all SQL from:
   `supabase/migrations/20260713_create_m0_worker_registry.sql`
4. Run it.
5. Open **Table Editor** and confirm `m0_worker_registry` exists.

Expected columns:

- `worker_name`
- `public_url`
- `status`
- `slot_start_ist`
- `slot_stop_ist`
- `registered_at`
- `expires_at`
- `last_health_at`
- `metadata`

## 2. Generate the registration token

Run this in Windows PowerShell:

```powershell
$Bytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Fill($Bytes)
$Token = [Convert]::ToBase64String($Bytes)
$Token
```

Save the output privately. Do not commit it.

## 3. Configure local development

Add these values to `abc-creator-app/.env.local`:

```text
M0_REGISTRATION_TOKEN=PASTE_THE_GENERATED_TOKEN
M0_ALLOWED_WORKERS=m0-cinefax
M0_ALLOWED_TUNNEL_SUFFIXES=.trycloudflare.com
```

The project must already contain its existing Supabase values:

```text
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Never prefix the registration token with `NEXT_PUBLIC_`.

## 4. Build-check the branch

From the `abc-creator-app` directory:

```bash
npm install
npm run build
```

Do not deploy if the build fails.

## 5. Configure Vercel

In the ABC Creator Vercel project, add these server environment variables:

```text
M0_REGISTRATION_TOKEN=<same generated token>
M0_ALLOWED_WORKERS=m0-cinefax
M0_ALLOWED_TUNNEL_SUFFIXES=.trycloudflare.com
```

Keep the existing Supabase environment variables unchanged.

Redeploy after the branch is merged.

## 6. Configure Kaggle secrets

In the `cinefax` Kaggle account, create two private secrets:

### `M0_REGISTRATION_URL`

```text
https://YOUR-REAL-ABC-CREATOR-DOMAIN/api/internal/m0/register
```

### `M0_REGISTRATION_TOKEN`

Use the exact same token configured in Vercel.

Grant the M0 test notebook access to both secrets.

## 7. Add the notebook cell

Open:

```text
scripts/kaggle/m0-register-worker-cell.py
```

Copy the complete file into a new Kaggle code cell immediately after the Cloudflare tunnel cell, after this output is produced:

```text
[WORKER_READY_URL] https://...trycloudflare.com
```

Test it first in `ABC_M0_Image_Worker_TEST_10_MIN`, not in the production notebook.

The test notebook should still use:

```python
FORCE_RUN_OUTSIDE_SLOT = True
```

and:

```python
delay = 600
```

The registration cell automatically gives forced test runs a short 20-minute registry expiry. Production runs expire at the real slot stop.

## 8. Expected successful notebook output

```text
[WORKER_READY_URL] https://...trycloudflare.com
[REGISTRATION] Attempt 1/6: 201 ...
[REGISTRATION] Worker URL registered successfully.
```

## 9. Verify Supabase

Open `m0_worker_registry` in Supabase Table Editor.

Expected row:

```text
worker_name: m0-cinefax
status: ready
public_url: current trycloudflare URL
expires_at: future timestamp
last_health_at: populated
```

## Security controls

- The endpoint requires a bearer token.
- Token comparison is timing-safe.
- Only configured worker names are accepted.
- Only HTTPS tunnel hosts from the configured allow-list are accepted.
- Custom URL credentials and ports are rejected.
- Registration lifetime is capped at six hours.
- The backend verifies `/health` before saving the worker.
- The reported worker name must match the submitted name.
- The worker must report `accepting_jobs: true`.
- Metadata size is capped.
- Responses are marked `no-store`.
- Supabase browser roles have no table privileges.

## Next stage

After registration is confirmed, wire `getActiveM0Worker()` into the text-to-image route for model `M0`, with server-side fallback when no M0 worker is healthy.
