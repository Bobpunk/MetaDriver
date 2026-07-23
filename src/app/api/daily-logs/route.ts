import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/db";
import { dailyLogs } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";

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

  const { date, goalAmount, kmDriven, fuelCost, otherExpenses, grossEarnings, workedMs } =
    await request.json();

  if (!date) {
    return NextResponse.json({ error: "Data é obrigatória." }, { status: 400 });
  }

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
      workedMs: workedMs ?? "0",
    })
    .returning();

  return NextResponse.json({ log: r });
}

export async function PATCH(request: NextRequest) {
  const user = await getUser(request);
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const id = Number(body.id);
  const fields = [
    "goalAmount",
    "kmDriven",
    "fuelCost",
    "otherExpenses",
    "grossEarnings",
    "workedMs",
  ] as const;

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Registro inválido." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.date ?? ""))) {
    return NextResponse.json({ error: "Informe uma data válida." }, { status: 400 });
  }

  for (const field of fields) {
    const value = Number(body[field]);
    if (!Number.isFinite(value) || value < 0) {
      return NextResponse.json(
        { error: "Os valores não podem ser negativos." },
        { status: 400 }
      );
    }
  }

  const [updated] = await db
    .update(dailyLogs)
    .set({
      date: body.date,
      goalAmount: String(body.goalAmount),
      kmDriven: String(body.kmDriven),
      fuelCost: String(body.fuelCost),
      otherExpenses: String(body.otherExpenses),
      grossEarnings: String(body.grossEarnings),
      workedMs: String(Math.round(Number(body.workedMs))),
    })
    .where(and(eq(dailyLogs.id, id), eq(dailyLogs.userEmail, user.email)))
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: "Jornada não encontrada." },
      { status: 404 }
    );
  }

  return NextResponse.json({ log: updated });
}
