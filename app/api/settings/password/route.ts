import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const {
      userId,
      currentPassword,
      newPassword,
    } = body;

    if (!userId || !currentPassword || !newPassword) {
      return Response.json(
        { error: 'Compila tutti i campi password' },
        { status: 400 },
      );
    }

    if (String(newPassword).length < 8) {
      return Response.json(
        { error: 'La nuova password deve avere almeno 8 caratteri' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return Response.json(
        { error: 'Utente non trovato' },
        { status: 404 },
      );
    }

    const validPassword = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!validPassword) {
      return Response.json(
        { error: 'Password attuale non corretta' },
        { status: 401 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return Response.json({
      success: true,
      message: 'Password aggiornata correttamente',
    });
  } catch (error) {
    console.error('PATCH /api/settings/password error:', error);

    return Response.json(
      {
        error: 'Errore aggiornamento password',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}