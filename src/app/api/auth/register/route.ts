import { NextResponse } from "next/server";
import { findUserByEmail, createUser, signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password, confirmPassword, name } = await request.json();

    // 1. Validação de campos obrigatórios
    if (!email || !password || !confirmPassword || !name) {
      return NextResponse.json(
        { error: "Nome completo, e-mail, senha e confirmação de senha são obrigatórios." },
        { status: 400 }
      );
    }

    // 2. Validação de confirmação de senha (Garantir que são iguais)
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "A confirmação de senha não coincide com a senha digitada." },
        { status: 400 }
      );
    }

    // 3. Validação do formato do e-mail
    const emailLower = email.toLowerCase();
    if (!emailLower.includes("@") || emailLower.length < 5) {
      return NextResponse.json(
        { error: "E-mail inválido." },
        { status: 400 }
      );
    }

    // 4. Validação de tamanho mínimo da senha (Mínimo 8 caracteres)
    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 8 caracteres." },
        { status: 400 }
      );
    }

    // 5. Validação de pelo menos uma letra maiúscula
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: "A senha deve conter pelo menos uma letra maiúscula." },
        { status: 400 }
      );
    }

    // 6. Validação de pelo menos um caractere especial (Ex: @, #, $, %, etc.)
    if (!/[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\\/]/.test(password)) {
      return NextResponse.json(
        { error: "A senha deve conter pelo menos um caractere especial (ex: @, #, $, !)." },
        { status: 400 }
      );
    }

    // 7. Validação do nome completo (Mínimo 2 caracteres)
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: "O nome deve ter no mínimo 2 caracteres." },
        { status: 400 }
      );
    }

    // 8. Verificação de e-mail duplicado no banco
    const existing = await findUserByEmail(emailLower);
    if (existing) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado." },
        { status: 409 }
      );
    }

    // 9. Persistência e criação da sessão
    let user;
    try {
      user = await createUser(emailLower, password, name.trim());
    } catch (insertErr: any) {
      if (insertErr?.code === "23505") {
        return NextResponse.json(
          { error: "Este e-mail já está cadastrado." },
          { status: 409 }
        );
      }
      throw insertErr;
    }

    const token = await signToken({
      email: user.email,
      name: user.name,
      pro: user.pro ?? false,
    });

    const response = NextResponse.json({
      token,
      user: { email: user.email, name: user.name, pro: user.pro ?? false },
    });

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Erro no registro:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}