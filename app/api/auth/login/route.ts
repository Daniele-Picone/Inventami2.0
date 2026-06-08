import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return Response.json(
        { error: 'Email e password obbligatorie' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            inviteKey: true,
            plan: true,
          },
        },
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
        {
          error:
            'Email non verificata. Completa prima la verifica con il codice.',
        },
        { status: 403 },
      );
    }

    const role = String(user.role || '').trim().toUpperCase();

    console.log('LOGIN USER ROLE:', role);

    return Response.json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        role,
        companyId: user.companyId,
        companyName: user.company?.name || '',
        inviteKey: role === 'MANAGER' ? user.company?.inviteKey : null,
        plan: user.company?.plan || 'FREE',
      },
    });
  } catch (error) {
    console.error('POST /api/auth/login error:', error);

    return Response.json(
      {
        error: 'Errore durante il login',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}