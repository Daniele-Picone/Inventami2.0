import { prisma } from '@/lib/prisma';

function makeLogo(value: string) {
  return value
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

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

    const restaurants = await prisma.restaurant.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
    });

    return Response.json({ restaurants });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Errore durante il caricamento ristoranti' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { companyId, name, type, city, address, color } = body;

    if (!companyId || !name) {
      return Response.json(
        { error: 'companyId e nome locale sono obbligatori' },
        { status: 400 },
      );
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        companyId,
        name,
        type: type || 'Ristorante',
        city: city || '',
        address: address || '',
        logo: makeLogo(name),
        color: color || '#7B2D3E',
      },
    });

    return Response.json({ restaurant });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Errore durante la creazione locale' },
      { status: 500 },
    );
  }
}