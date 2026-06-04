import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return Response.json(
        { error: 'Email e codice obbligatori' },
        { status: 400 },
      );
    }

    const savedCode = await prisma.verificationCode.findFirst({
      where: { email, code },
      orderBy: { createdAt: 'desc' },
    });

    if (!savedCode) {
      return Response.json(
        { error: 'Codice non valido' },
        { status: 400 },
      );
    }

    if (savedCode.expiresAt < new Date()) {
      return Response.json(
        { error: 'Codice scaduto' },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { email },
      data: { verified: true },
      include: {
        company: true,
      },
    });

    await prisma.verificationCode.deleteMany({
      where: { email },
    });

    return Response.json({
      success: true,
      message: 'Iscrizione inviata',
      user: {
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        role: user.role,
        verified: user.verified,
        companyName: user.company?.name,
        inviteKey: user.role === 'MANAGER' ? user.company?.inviteKey : null,
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Errore verifica codice' },
      { status: 500 },
    );
  }
}