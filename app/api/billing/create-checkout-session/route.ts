import { prisma } from '@/lib/prisma';

type Plan = 'PRO' | 'PLUS';

const VALID_PAID_PLANS: Plan[] = ['PRO', 'PLUS'];

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      userId,
      companyId,
      plan,
    } = body as {
      userId?: string;
      companyId?: string;
      plan?: Plan;
    };

    if (!userId || !companyId || !plan) {
      return Response.json(
        { error: 'userId, companyId e plan sono obbligatori' },
        { status: 400 },
      );
    }

    if (!VALID_PAID_PLANS.includes(plan)) {
      return Response.json(
        { error: 'Piano checkout non valido' },
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
        { error: 'Solo il manager può gestire il checkout' },
        { status: 403 },
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return Response.json(
        {
          error: 'Stripe non configurato',
          message:
            'Aggiungi STRIPE_SECRET_KEY e i price id per attivare il checkout reale.',
        },
        { status: 501 },
      );
    }

    return Response.json(
      {
        error: 'Checkout Stripe non ancora implementato',
        message:
          'La rotta è pronta. Il prossimo step è collegare Stripe Checkout.',
      },
      { status: 501 },
    );
  } catch (error) {
    console.error('POST /api/billing/create-checkout-session error:', error);

    return Response.json(
      {
        error: 'Errore creazione checkout',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}