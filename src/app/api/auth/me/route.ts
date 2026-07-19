import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const user = await verifyToken(token);

  if (!user) {
    return NextResponse.json(
      { error: "Sessão inválida ou expirada." },
      { status: 401 }
    );
  }

  return NextResponse.json({ user });
}