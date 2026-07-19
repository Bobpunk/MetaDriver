import { SignJWT, jwtVerify } from "jose";
import { compare, hash } from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-dev-secret"
);

export type AuthUser = {
  email: string;
  name: string;
  pro: boolean;
};

export async function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({ sub: user.email, name: user.name, pro: user.pro })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      email: (payload.sub as string) || "",
      name: (payload.name as string) || "",
      pro: (payload.pro as boolean) || false,
    };
  } catch {
    return null;
  }
}

export async function findUserByEmail(email: string) {
  const lower = email.toLowerCase();
  const result = await db.select().from(users).where(eq(users.email, lower));
  return result[0] || null;
}

export async function createUser(
  email: string,
  password: string,
  name: string
) {
  const lower = email.toLowerCase();
  const hashed = await hash(password, 12);
  const result = await db
    .insert(users)
    .values({ email: lower, password: hashed, name })
    .returning();
  return result[0];
}

export async function setProStatus(email: string, pro: boolean) {
  const lower = email.toLowerCase();
  const result = await db
    .update(users)
    .set({ pro })
    .where(eq(users.email, lower))
    .returning();
  return result[0] || null;
}

export async function verifyPassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return compare(plain, hashed);
}

export function getCredentials() {
  return {
    email: process.env.AUTH_EMAIL || "",
    password: process.env.AUTH_PASSWORD || "",
  };
}
