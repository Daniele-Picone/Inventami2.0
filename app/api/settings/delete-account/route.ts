import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request) {
  try {
    const body = await req.json();

    const {
      userId,
      companyId,
      confirmText,
    } = body as {
      userId?: string;
      companyId?: string;
      confirmText?: string;
    };

    if (!userId || !companyId) {
      return Response.json(
        { error: 'userId e companyId sono obbligatori' },
        { status: 400 },
      );
    }

    if (confirmText !== 'CANCELLA') {
      return Response.json(
        { error: 'Conferma non valida. Scrivi CANCELLA.' },
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
      await prisma.verificationCode.deleteMany({
        where: { email: user.email },
      });

      await prisma.user.delete({
        where: { id: user.id },
      });

      return Response.json({
        success: true,
        scope: 'USER',
        message: 'Account utente cancellato',
      });
    }

    await prisma.$transaction(async (tx) => {
      const companyUsers = await tx.user.findMany({
        where: { companyId },
        select: {
          id: true,
          email: true,
        },
      });

      const restaurants = await tx.restaurant.findMany({
        where: { companyId },
        select: { id: true },
      });

      const restaurantIds = restaurants.map((restaurant) => restaurant.id);

      const wines = await tx.wine.findMany({
        where: {
          restaurantId: {
            in: restaurantIds,
          },
        },
        select: { id: true },
      });

      const wineIds = wines.map((wine) => wine.id);

      await tx.inventoryMovement.deleteMany({
        where: {
          wineId: {
            in: wineIds,
          },
        },
      });

      await tx.wine.deleteMany({
        where: {
          id: {
            in: wineIds,
          },
        },
      });

      await tx.restaurant.deleteMany({
        where: {
          companyId,
        },
      });

      await tx.invite.deleteMany({
        where: {
          companyId,
        },
      });

      await tx.verificationCode.deleteMany({
        where: {
          email: {
            in: companyUsers.map((companyUser) => companyUser.email),
          },
        },
      });

      await tx.user.deleteMany({
        where: {
          companyId,
        },
      });

      await tx.company.delete({
        where: {
          id: companyId,
        },
      });
    });

    return Response.json({
      success: true,
      scope: 'COMPANY',
      message: 'Società e account collegati cancellati',
    });
  } catch (error) {
    console.error('DELETE /api/settings/delete-account error:', error);

    return Response.json(
      {
        error: 'Errore cancellazione account',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}