import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "capaciti_session";
const ALGORITHM = "HS256";
const SESSION_DURATION = "7d";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set to a strong random value");
  }
  return new TextEncoder().encode(secret);
}

/** Only the user id is stored in the token. Role and company are looked up
 * fresh from the database on every request so authorization decisions are
 * never made against a stale/cached claim (e.g. right after a user creates
 * their company for the first time). */
export interface SessionTokenPayload {
  userId: string;
}

export async function createSessionCookie(payload: SessionTokenPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey());

  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function readSessionCookie(): Promise<SessionTokenPayload | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.userId !== "string") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export function clearSessionCookie(): void {
  cookies().set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
}
