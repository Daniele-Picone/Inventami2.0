import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json(
        { error: 'userId mancante' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            inviteKey: true,
          },
        },
      },
    });

    if (!user) {
      return Response.json(
        { error: 'Utente non trovato' },
        { status: 404 },
      );
    }

    return Response.json({
      user: {
        id: user.id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company.name,
        inviteKey: user.role === 'MANAGER' ? user.company.inviteKey : null,
      },
    });
  } catch (error) {
    console.error('GET /api/settings/profile error:', error);

    return Response.json(
      {
        error: 'Errore caricamento profilo',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const userId = String(body.userId || '');
    const nome = String(body.nome || '').trim();
    const cognome = String(body.cognome || '').trim();
    const companyName = String(body.companyName || '').trim();

    if (!userId || !nome || !cognome) {
      return Response.json(
        { error: 'userId, nome e cognome sono obbligatori' },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            inviteKey: true,
          },
        },
      },
    });

    if (!existingUser) {
      return Response.json(
        { error: 'Utente non trovato' },
        { status: 404 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        nome,
        cognome,
      },
      select: {
        id: true,
        nome: true,
        cognome: true,
        email: true,
        role: true,
        companyId: true,
      },
    });

    let updatedCompany = existingUser.company;

    if (
      existingUser.role === 'MANAGER' &&
      companyName &&
      companyName !== existingUser.company.name
    ) {
      updatedCompany = await prisma.company.update({
        where: { id: existingUser.companyId },
        data: {
          name: companyName,
        },
        select: {
          id: true,
          name: true,
          inviteKey: true,
        },
      });
    }

    return Response.json({
      success: true,
      user: {
        id: updatedUser.id,
        nome: updatedUser.nome,
        cognome: updatedUser.cognome,
        email: updatedUser.email,
        role: updatedUser.role,
        companyId: updatedUser.companyId,
        companyName: updatedCompany.name,
        inviteKey:
          updatedUser.role === 'MANAGER' ? updatedCompany.inviteKey : null,
      },
    });
  } catch (error) {
    console.error('PATCH /api/settings/profile error:', error);

    return Response.json(
      {
        error: 'Errore aggiornamento profilo',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}