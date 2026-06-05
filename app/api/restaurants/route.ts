import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
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
    orderBy: {
      createdAt: 'asc',
    },
  });

  return Response.json({ restaurants });
}