import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import test from "node:test";

import { createMlServiceAuthorization } from "../lib/server/ml-service-auth.ts";
import {
  clientAddress,
  consumeMemoryLimit,
  redisCredentials,
} from "../lib/server/rate-limit.ts";
import { createAbortScope } from "../lib/server/abort-scope.ts";

test("ML service JWT is short-lived, signed, and bound to the request body", () => {
  const secret = "test-only-service-secret-with-at-least-32-bytes";
  process.env.ML_API_JWT_SECRET = secret;
  const body = JSON.stringify({ text: "Проверяемый текст" });
  const now = 2_000_000_000;
  const authorization = createMlServiceAuthorization(body, now);
  const [header, payload, signature] = authorization.token.split(".");
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

  assert.equal(
    signature,
    createHmac("sha256", secret)
      .update(`${header}.${payload}`, "utf8")
      .digest("base64url"),
  );
  assert.equal(claims.iss, "rufact-web");
  assert.equal(claims.aud, "rufact-ml");
  assert.equal(claims.sub, "/predict");
  assert.equal(claims.iat, now);
  assert.equal(claims.exp, now + 30);
  assert.equal(claims.jti, authorization.requestId);
  assert.equal(
    claims.bodySha256,
    createHash("sha256").update(body, "utf8").digest("hex"),
  );
});

test("local limiter denies requests after the configured window allowance", () => {
  const identifier = `unit-${Date.now()}`;
  const now = 1_000_000;

  assert.equal(consumeMemoryLimit(identifier, now, 2, 60).allowed, true);
  assert.equal(consumeMemoryLimit(identifier, now + 1, 2, 60).allowed, true);
  const blocked = consumeMemoryLimit(identifier, now + 2, 2, 60);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.equal(consumeMemoryLimit(identifier, now + 60_001, 2, 60).allowed, true);
});

test("rate limiter accepts Vercel Marketplace Redis credentials", () => {
  assert.deepEqual(
    redisCredentials({
      KV_REST_API_URL: "https://marketplace-redis.example",
      KV_REST_API_TOKEN: "marketplace-token",
    }),
    {
      url: "https://marketplace-redis.example",
      token: "marketplace-token",
    },
  );
  assert.deepEqual(
    redisCredentials({
      UPSTASH_REDIS_REST_URL: "https://direct-redis.example",
      UPSTASH_REDIS_REST_TOKEN: "direct-token",
      KV_REST_API_URL: "https://marketplace-redis.example",
      KV_REST_API_TOKEN: "marketplace-token",
    }),
    {
      url: "https://direct-redis.example",
      token: "direct-token",
    },
  );
  assert.equal(redisCredentials({ KV_REST_API_URL: "https://missing-token" }), null);
});

test("client IP prefers the Vercel-controlled forwarding header", () => {
  const request = new Request("https://rufact.example/api/analyze", {
    headers: {
      "x-vercel-forwarded-for": "203.0.113.10, 10.0.0.1",
      "x-forwarded-for": "198.51.100.99",
      "x-real-ip": "192.0.2.5",
    },
  });

  assert.equal(clientAddress(request), "203.0.113.10");
});

test("abort scope propagates an abandoned client request", () => {
  const parent = new AbortController();
  const scope = createAbortScope(parent.signal, 60_000);

  assert.equal(scope.signal.aborted, false);
  parent.abort();
  assert.equal(scope.signal.aborted, true);
  scope.cleanup();
});
