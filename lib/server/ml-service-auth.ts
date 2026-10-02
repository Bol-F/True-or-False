import { createHash, createHmac, randomUUID } from "node:crypto";

const JWT_ALGORITHM = "HS256";
const JWT_ISSUER = "rufact-web";
const JWT_AUDIENCE = "rufact-ml";
const JWT_SUBJECT = "/predict";
const JWT_LIFETIME_SECONDS = 30;
const MIN_SECRET_BYTES = 32;

interface MlServiceClaims {
  iss: typeof JWT_ISSUER;
  aud: typeof JWT_AUDIENCE;
  sub: typeof JWT_SUBJECT;
  iat: number;
  exp: number;
  jti: string;
  bodySha256: string;
}

export interface MlServiceAuthorization {
  token: string;
  requestId: string;
}

function encodeJson(value: object) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function configuredSecret() {
  const secret = process.env.ML_API_JWT_SECRET?.trim() ?? "";
  if (Buffer.byteLength(secret, "utf8") < MIN_SECRET_BYTES) {
    throw new Error(
      `ML_API_JWT_SECRET must contain at least ${MIN_SECRET_BYTES} bytes.`,
    );
  }
  return secret;
}

export function createMlServiceAuthorization(
  requestBody: string,
  now = Math.floor(Date.now() / 1_000),
): MlServiceAuthorization {
  const requestId = randomUUID();
  const header = encodeJson({ alg: JWT_ALGORITHM, typ: "JWT" });
  const claims: MlServiceClaims = {
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
    sub: JWT_SUBJECT,
    iat: now,
    exp: now + JWT_LIFETIME_SECONDS,
    jti: requestId,
    bodySha256: createHash("sha256").update(requestBody, "utf8").digest("hex"),
  };
  const payload = encodeJson(claims);
  const unsignedToken = `${header}.${payload}`;
  const signature = createHmac("sha256", configuredSecret())
    .update(unsignedToken, "utf8")
    .digest("base64url");

  return { token: `${unsignedToken}.${signature}`, requestId };
}
