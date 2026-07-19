import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/db";
import { dailyLogs } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

async function getUser(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const email = request.nextUrl.searchParams.get("email");
  if (email !== user.email) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const logs = await db
    .select()
    .from(dailyLogs)
    .where(eq(dailyLogs.userEmail, user.email))
    .orderBy(desc(dailyLogs.date));

  return NextResponse.json({ logs });
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { date, goalAmount, kmDriven, fuelCost, otherExpenses, grossEarnings } =
    await request.json();

  if (!date) {
    return NextResponse.json({ error: "Data é obrigatória." }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(dailyLogs)
    .where(
      and(
        eq(dailyLogs.userEmail, user.email),
        eq(dailyLogs.date, date)
      )
    );

  let log;
  if (existing.length > 0) {
    const [r] = await db
      .update(dailyLogs)
      .set({
        goalAmount: goalAmount ?? "0",
        kmDriven: kmDriven ?? "0",
        fuelCost: fuelCost ?? "0",
        otherExpenses: otherExpenses ?? "0",
        grossEarnings: grossEarnings ?? "0",
      })
      .where(eq(dailyLogs.id, existing[0].id))
      .returning();
    log = r;
  } else {
    const [r] = await db
      .insert(dailyLogs)
      .values({
        userEmail: user.email,
        date,
        goalAmount: goalAmount ?? "0",
        kmDriven: kmDriven ?? "0",
        fuelCost: fuelCost ?? "0",
        otherExpenses: otherExpenses ?? "0",
        grossEarnings: grossEarnings ?? "0",
      })
      .returning();
    log = r;
  }

  return NextResponse.json({ log });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser(request);
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID é obrigatório." }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(dailyLogs)
    .where(eq(dailyLogs.id, parseInt(id)));

  if (!existing.length || existing[0].userEmail !== user.email) {
    return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
  }

  await db.delete(dailyLogs).where(eq(dailyLogs.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
