# ============================================================
# ABC CREATOR M0 — REGISTER PUBLIC WORKER URL
#
# Place this cell immediately after the Cloudflare cell prints:
#   [WORKER_READY_URL] https://....trycloudflare.com
#
# Required private Kaggle secrets:
#   M0_REGISTRATION_URL
#   M0_REGISTRATION_TOKEN
# ============================================================

if not WORKER_ENABLED:
    print("[REGISTRATION] Skipped: outside slot window.")
else:
    import time
    import requests
    from kaggle_secrets import UserSecretsClient

    secrets_client = UserSecretsClient()

    registration_url = secrets_client.get_secret("M0_REGISTRATION_URL")
    registration_token = secrets_client.get_secret("M0_REGISTRATION_TOKEN")

    if not registration_url or not registration_token:
        raise RuntimeError(
            "Missing Kaggle secrets M0_REGISTRATION_URL or M0_REGISTRATION_TOKEN."
        )

    # Production runs expire at the real slot stop. A forced 10-minute test
    # run uses a short expiry so it can be tested outside the normal slot.
    if FORCE_RUN_OUTSIDE_SLOT:
        registration_expires_at = (ist_now() + timedelta(minutes=20)).isoformat()
    else:
        registration_expires_at = get_slot_window()[1].isoformat()

    registration_payload = {
        "workerName": WORKER_NAME,
        "publicUrl": public_url,
        "slotStartIST": SLOT_START_IST,
        "slotStopIST": STOP_SESSION_AT_IST,
        "expiresAt": registration_expires_at,
        "metadata": {
            "model": "M0 Z-Image-Turbo",
            "provider": "kaggle",
            "forcedTestRun": bool(FORCE_RUN_OUTSIDE_SLOT),
        },
    }

    registration_error = None

    for attempt in range(1, 7):
        try:
            response = requests.post(
                registration_url,
                headers={
                    "Authorization": f"Bearer {registration_token}",
                    "Content-Type": "application/json",
                },
                json=registration_payload,
                timeout=30,
            )

            print(
                f"[REGISTRATION] Attempt {attempt}/6:",
                response.status_code,
                response.text[:500],
            )

            if response.status_code in (200, 201):
                registration_error = None
                print("[REGISTRATION] Worker URL registered successfully.")
                break

            registration_error = RuntimeError(
                f"Registration returned HTTP {response.status_code}: "
                f"{response.text[:500]}"
            )
        except Exception as exc:
            registration_error = exc
            print(f"[REGISTRATION] Attempt {attempt}/6 failed:", repr(exc))

        if attempt < 6:
            time.sleep(10)

    if registration_error is not None:
        raise RuntimeError(
            "Worker registration failed after 6 attempts: "
            f"{registration_error}"
        )
