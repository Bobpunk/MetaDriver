import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

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

  try {
    const rows = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userEmail, user.email));

    if (rows.length === 0) {
      return NextResponse.json({ settings: null });
    }

    const s = rows[0];
    return NextResponse.json({
      settings: {
        work: {
          workDays: s.workDays,
          hoursPerDay: s.hoursPerDay,
          weeklyGoal: s.weeklyGoal,
          scheduleMode: s.scheduleMode,
          cycleWorkDays: s.cycleWorkDays,
          cycleRestDays: s.cycleRestDays,
        },
        vehicle: s.vehicle,
        costs: {
          financing: s.financing,
          maintenance: s.maintenance,
          insurance: s.insurance,
          otherMonthly: s.otherMonthly,
          annualTaxes: s.annualTaxes,
          emergencyFund: s.emergencyFund,
          leisure: s.leisure,
        },
      },
    });
  } catch (err) {
    console.error("GET user-settings error:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUser(request);
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { work, vehicle, costs } = body;

    const data = {
      userEmail: user.email,
      workDays: work.workDays,
      hoursPerDay: work.hoursPerDay,
      weeklyGoal: work.weeklyGoal,
      scheduleMode: work.scheduleMode,
      cycleWorkDays: work.cycleWorkDays,
      cycleRestDays: work.cycleRestDays,
      vehicle,
      financing: costs.financing,
      maintenance: costs.maintenance,
      insurance: costs.insurance,
      otherMonthly: costs.otherMonthly,
      annualTaxes: costs.annualTaxes,
      emergencyFund: costs.emergencyFund,
      leisure: costs.leisure,
      updatedAt: new Date(),
    };

    const existing = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userEmail, user.email));

    if (existing.length > 0) {
      await db
        .update(userSettings)
        .set(data)
        .where(eq(userSettings.userEmail, user.email));
    } else {
      await db.insert(userSettings).values(data);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT user-settings error:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
