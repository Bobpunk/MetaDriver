import { NextResponse } from "next/server";
import { findUserByEmail, setProStatus, getCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const creds = getCredentials();
    const token = authHeader.slice(7);
    if (token !== creds.password) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { email, pro } = await request.json();
    if (!email || typeof pro !== "boolean") {
      return NextResponse.json(
        { error: "Email e pro (boolean) são obrigatórios." },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const updated = await setProStatus(email, pro);
    return NextResponse.json({
      user: { email: updated.email, name: updated.name, pro: updated.pro },
    });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
