import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      userId,
      companyId,
    } = body as {
      userId?: string;
      companyId?: string;
    };

    if (!userId || !companyId) {
      return Response.json(
        { error: 'userId e companyId sono obbligatori' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
      },
    });

    if (!user) {
      return Response.json(
        { error: 'Utente non trovato' },
        { status: 404 },
      );
    }

    if (user.companyId !== companyId) {
      return Response.json(
        { error: 'Utente non autorizzato per questa società' },
        { status: 403 },
      );
    }

    if (user.role !== 'MANAGER') {
      return Response.json(
        { error: 'Solo il manager può gestire l’abbonamento' },
        { status: 403 },
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return Response.json(
        {
          error: 'Stripe non configurato',
          message:
            'Aggiungi STRIPE_SECRET_KEY per attivare il portale clienti.',
        },
        { status: 501 },
      );
    }

    return Response.json(
      {
        error: 'Customer portal Stripe non ancora implementato',
        message:
          'La rotta è pronta. Il prossimo step è collegare Stripe Billing Portal.',
      },
      { status: 501 },
    );
  } catch (error) {
    console.error('POST /api/billing/customer-portal error:', error);

    return Response.json(
      {
        error: 'Errore apertura portale cliente',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}