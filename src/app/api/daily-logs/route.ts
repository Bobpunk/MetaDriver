import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/db";
import { dailyLogs } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

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

  const { id, date, goalAmount, kmDriven, fuelCost, otherExpenses, grossEarnings, confirmReplace } =
    await request.json();

  if (!date) {
    return NextResponse.json({ error: "Data é obrigatória." }, { status: 400 });
  }

  // If updating an existing record by ID
  if (id) {
    const existing = await db
      .select()
      .from(dailyLogs)
      .where(eq(dailyLogs.id, parseInt(id)));

    if (!existing.length || existing[0].userEmail !== user.email) {
      return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
    }

    const [r] = await db
      .update(dailyLogs)
      .set({
        date,
        goalAmount: goalAmount ?? "0",
        kmDriven: kmDriven ?? "0",
        fuelCost: fuelCost ?? "0",
        otherExpenses: otherExpenses ?? "0",
        grossEarnings: grossEarnings ?? "0",
      })
      .where(eq(dailyLogs.id, parseInt(id)))
      .returning();

    return NextResponse.json({ log: r });
  }

  // Check existing records for this day
  const existing = await db
    .select({
      id: dailyLogs.id,
      goalAmount: dailyLogs.goalAmount,
      kmDriven: dailyLogs.kmDriven,
      fuelCost: dailyLogs.fuelCost,
      otherExpenses: dailyLogs.otherExpenses,
      grossEarnings: dailyLogs.grossEarnings,
      createdAt: dailyLogs.createdAt,
    })
    .from(dailyLogs)
    .where(
      and(
        eq(dailyLogs.userEmail, user.email),
        eq(dailyLogs.date, date)
      )
    )
    .orderBy(dailyLogs.createdAt);

  // If 3+ records and this is a new entry (not editing), ask for confirmation


  // If 3+ records and user confirmed, delete oldest first
  if (existing.length >= 3 && confirmReplace) {
    await db.delete(dailyLogs).where(
      and(
        eq(dailyLogs.userEmail, user.email),
        eq(dailyLogs.date, date),
        eq(dailyLogs.id, existing[0].id)
      )
    );
  }

  // Insert new record
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

  return NextResponse.json({ log: r, replaced: existing.length >= 3, maxPerDay: 3 });
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
