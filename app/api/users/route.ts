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

  const users = await prisma.user.findMany({
    where: { companyId },
    select: {
      id: true,
      nome: true,
      cognome: true,
      email: true,
      role: true,
      verified: true,
      createdAt: true,
      company: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return Response.json({ users });
}