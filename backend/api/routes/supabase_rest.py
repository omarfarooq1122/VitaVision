"""Tiny PostgREST helper that acts as the signed-in user (RLS applies)."""

from __future__ import annotations

import httpx
from fastapi import HTTPException

from config import get_settings


def rest(method: str, table: str, token: str, *, params=None, json=None):
    s = get_settings()
    if not (s.supabase_url and s.supabase_anon_key):
        raise HTTPException(503, "Saving is not configured on the server.")
    r = httpx.request(
        method,
        f"{s.supabase_url.rstrip('/')}/rest/v1/{table}",
        params=params,
        json=json,
        headers={
            "apikey": s.supabase_anon_key,
            "Authorization": f"Bearer {token}",
            "Prefer": "return=representation",
        },
        timeout=15.0,
    )
    if r.status_code >= 300:
        raise HTTPException(502, "Could not save or load your data. Please try again.")
    return r.json() if r.content else None
