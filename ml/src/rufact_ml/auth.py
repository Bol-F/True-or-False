from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any

from fastapi import HTTPException, Request, status

JWT_ISSUER = "rufact-web"
JWT_AUDIENCE = "rufact-ml"
JWT_SUBJECT = "/predict"
MAX_TOKEN_LIFETIME_SECONDS = 60
CLOCK_SKEW_SECONDS = 5
MIN_SECRET_BYTES = 32


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid service authorization.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _decode_segment(segment: str) -> Any:
    padding = "=" * (-len(segment) % 4)
    return json.loads(base64.urlsafe_b64decode(segment + padding))


async def require_service_jwt(request: Request) -> None:
    secret = os.getenv("ML_API_JWT_SECRET", "").strip()
    if len(secret.encode("utf-8")) < MIN_SECRET_BYTES:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service authentication is not configured.",
        )

    authorization = request.headers.get("authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise _unauthorized()

    parts = token.split(".")
    if len(parts) != 3:
        raise _unauthorized()
    encoded_header, encoded_payload, encoded_signature = parts

    expected_signature = base64.urlsafe_b64encode(
        hmac.new(
            secret.encode("utf-8"),
            f"{encoded_header}.{encoded_payload}".encode(),
            hashlib.sha256,
        ).digest()
    ).rstrip(b"=").decode()
    if not hmac.compare_digest(expected_signature, encoded_signature):
        raise _unauthorized()

    try:
        header = _decode_segment(encoded_header)
        claims = _decode_segment(encoded_payload)
    except (ValueError, UnicodeDecodeError, json.JSONDecodeError):
        raise _unauthorized() from None

    if not isinstance(header, dict) or header != {"alg": "HS256", "typ": "JWT"}:
        raise _unauthorized()
    if not isinstance(claims, dict):
        raise _unauthorized()

    issued_at = claims.get("iat")
    expires_at = claims.get("exp")
    request_id = claims.get("jti")
    now = int(time.time())
    valid_times = (
        type(issued_at) is int
        and type(expires_at) is int
        and issued_at <= now + CLOCK_SKEW_SECONDS
        and expires_at > now - CLOCK_SKEW_SECONDS
        and 0 < expires_at - issued_at <= MAX_TOKEN_LIFETIME_SECONDS
    )
    valid_identity = (
        claims.get("iss") == JWT_ISSUER
        and claims.get("aud") == JWT_AUDIENCE
        and claims.get("sub") == JWT_SUBJECT
        and isinstance(request_id, str)
        and 0 < len(request_id) <= 128
        and hmac.compare_digest(request.headers.get("x-request-id", ""), request_id)
    )
    if not valid_times or not valid_identity:
        raise _unauthorized()

    raw_body = await request.body()
    expected_digest = hashlib.sha256(raw_body).hexdigest()
    body_digest = claims.get("bodySha256")
    if not isinstance(body_digest, str) or not hmac.compare_digest(
        expected_digest, body_digest
    ):
        raise _unauthorized()
