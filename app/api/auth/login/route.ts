import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { error: 'Email e password obbligatorie' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
      },
    });

    if (!user) {
      return Response.json(
        { error: 'Credenziali non valide' },
        { status: 401 },
      );
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return Response.json(
        { error: 'Credenziali non valide' },
        { status: 401 },
      );
    }

    if (!user.verified) {
      return Response.json(
        { error: 'Email non verificata. Completa prima la verifica con codice.' },
        { status: 403 },
      );
    }

    return Response.json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company?.name,
        inviteKey: user.role === 'MANAGER' ? user.company?.inviteKey : null,
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Errore durante il login' },
      { status: 500 },
    );
  }
}