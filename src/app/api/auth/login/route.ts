import { NextResponse } from "next/server";
import {
  signToken,
  getCredentials,
  findUserByEmail,
  verifyPassword,
} from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase();

    // 1. Tenta login como admin via env vars
    const creds = getCredentials();
    if (emailLower === creds.email && password === creds.password) {
      const adminUser: AuthUser = { email: emailLower, name: "Administrador", pro: true };
      const token = await signToken(adminUser);
      return respondWithCookie(token, adminUser);
    }

    // 2. Tenta login no banco
    const user = await findUserByEmail(emailLower);
    if (!user) {
      return NextResponse.json(
        { error: "E-mail ou senha inválidos." },
        { status: 401 }
      );
    }

    const match = await verifyPassword(password, user.password);
    if (!match) {
      return NextResponse.json(
        { error: "E-mail ou senha inválidos." },
        { status: 401 }
      );
    }

    const token = await signToken({ email: user.email, name: user.name, pro: user.pro ?? false });
    return respondWithCookie(token, { email: user.email, name: user.name, pro: user.pro ?? false });
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

function respondWithCookie(
  token: string,
  user: { email: string; name: string; pro: boolean }
) {
  const response = NextResponse.json({ token, user });
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}
