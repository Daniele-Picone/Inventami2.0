import { prisma } from '@/lib/prisma';

type Plan = 'FREE' | 'PRO' | 'PLUS';

const VALID_PLANS: Plan[] = ['FREE', 'PRO', 'PLUS'];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return Response.json(
        { error: 'companyId mancante' },
        { status: 400 },
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        inviteKey: true,
        plan: true,
      },
    });

    if (!company) {
      return Response.json(
        { error: 'Società non trovata' },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      plan: company.plan,
      company,
    });
  } catch (error) {
    console.error('GET /api/billing/plan error:', error);

    return Response.json(
      {
        error: 'Errore caricamento piano',
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
    const companyId = String(body.companyId || '');
    const plan = String(body.plan || '') as Plan;

    if (!userId || !companyId || !plan) {
      return Response.json(
        { error: 'userId, companyId e plan sono obbligatori' },
        { status: 400 },
      );
    }

    if (!VALID_PLANS.includes(plan)) {
      return Response.json(
        { error: 'Piano non valido' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        companyId: true,
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
        { error: 'Solo il manager può modificare il piano' },
        { status: 403 },
      );
    }

    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        plan,
      },
      select: {
        id: true,
        name: true,
        inviteKey: true,
        plan: true,
      },
    });

    return Response.json({
      success: true,
      plan: company.plan,
      company,
      message: `Piano aggiornato a ${company.plan}`,
    });
  } catch (error) {
    console.error('PATCH /api/billing/plan error:', error);

    return Response.json(
      {
        error: 'Errore aggiornamento piano',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}