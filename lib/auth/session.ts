import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { AUTH_COOKIE_NAME, AUTH_SECRET } from "./config";

const secret = new TextEncoder().encode(AUTH_SECRET);

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);

  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, secret);

    if (
      typeof payload.id !== "number" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }

    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}