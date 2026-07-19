import { NextResponse } from "next/server";
import { db } from "@/db";
import { emails } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { email, name, message, origin } = await request.json();

    if (!email || email.length < 5 || !email.includes("@")) {
      return NextResponse.json(
        { error: "E-mail inválido." },
        { status: 400 }
      );
    }

    await db
      .insert(emails)
      .values({
        email,
        name: name || null,
        message: message || null,
        origin: origin || "web",
      })
      .onConflictDoNothing({ target: emails.email })
      .execute();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro ao salvar email:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
