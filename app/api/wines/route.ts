import { prisma } from '@/lib/prisma';

type WineCategory = 'ROSSO' | 'BIANCO' | 'ROSE' | 'SPUMANTE' | 'DOLCE';
type WineStatus = 'DISPONIBILE' | 'ESAURIMENTO' | 'ESAURITO' | 'ARCHIVIATO';

function resolveStatus(stock: number, status?: WineStatus): WineStatus {
  if (status) return status;
  if (stock <= 0) return 'ESAURITO';
  if (stock <= 3) return 'ESAURIMENTO';
  return 'DISPONIBILE';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const restaurantId = searchParams.get('restaurantId');

    if (!companyId) {
      return Response.json(
        { error: 'companyId mancante' },
        { status: 400 },
      );
    }

    const wines = await prisma.wine.findMany({
      where: {
        restaurant: {
          companyId,
        },
        ...(restaurantId ? { restaurantId } : {}),
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Response.json({ wines });
  } catch (error) {
    console.error('GET /api/wines error:', error);

    return Response.json(
      {
        error: 'Errore durante il caricamento vini',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      producer,
      region,
      denomination,
      vintage,
      category,
      stock,
      glassPrice,
      bottlePrice,
      alcohol,
      format,
      notes,
      pairings,
      inMenu,
      restaurantId,
    } = body;

    if (
      !name ||
      !producer ||
      !region ||
      !denomination ||
      !vintage ||
      !category ||
      stock === undefined ||
      bottlePrice === undefined ||
      !restaurantId
    ) {
      return Response.json(
        { error: 'Compila tutti i campi obbligatori del vino' },
        { status: 400 },
      );
    }

    const parsedStock = Number(stock);
    const parsedBottlePrice = Number(bottlePrice);
    const parsedGlassPrice = Number(glassPrice || 0);
    const parsedAlcohol = Number(alcohol || 0);
    const parsedVintage = Number(vintage);

    if (
      Number.isNaN(parsedStock) ||
      Number.isNaN(parsedBottlePrice) ||
      Number.isNaN(parsedGlassPrice) ||
      Number.isNaN(parsedAlcohol) ||
      Number.isNaN(parsedVintage)
    ) {
      return Response.json(
        { error: 'Stock, prezzi, alcol e annata devono essere numeri validi' },
        { status: 400 },
      );
    }

    const wine = await prisma.wine.create({
      data: {
        name,
        producer,
        region,
        denomination,
        vintage: parsedVintage,
        category: category as WineCategory,
        stock: parsedStock,
        glassPrice: parsedGlassPrice,
        bottlePrice: parsedBottlePrice,
        alcohol: parsedAlcohol,
        format: format || '0.75L',
        notes: notes || '',
        pairings: pairings || '',
        status: resolveStatus(parsedStock),
        inMenu: Boolean(inMenu),
        restaurantId,
      },
    });

    return Response.json({ wine }, { status: 201 });
  } catch (error) {
    console.error('POST /api/wines error:', error);

    return Response.json(
      {
        error: 'Errore durante la creazione vino',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const {
      id,
      name,
      producer,
      region,
      denomination,
      vintage,
      category,
      stock,
      glassPrice,
      bottlePrice,
      alcohol,
      format,
      notes,
      pairings,
      status,
      inMenu,
    } = body;

    if (!id) {
      return Response.json(
        { error: 'id vino mancante' },
        { status: 400 },
      );
    }

    const parsedStock = stock !== undefined ? Number(stock) : undefined;

    const wine = await prisma.wine.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(producer !== undefined ? { producer } : {}),
        ...(region !== undefined ? { region } : {}),
        ...(denomination !== undefined ? { denomination } : {}),
        ...(vintage !== undefined ? { vintage: Number(vintage) } : {}),
        ...(category !== undefined ? { category: category as WineCategory } : {}),
        ...(parsedStock !== undefined ? { stock: parsedStock } : {}),
        ...(glassPrice !== undefined ? { glassPrice: Number(glassPrice) } : {}),
        ...(bottlePrice !== undefined ? { bottlePrice: Number(bottlePrice) } : {}),
        ...(alcohol !== undefined ? { alcohol: Number(alcohol) } : {}),
        ...(format !== undefined ? { format } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(pairings !== undefined ? { pairings } : {}),
        ...(inMenu !== undefined ? { inMenu: Boolean(inMenu) } : {}),
        ...(parsedStock !== undefined || status !== undefined
          ? {
              status: resolveStatus(
                parsedStock ?? 1,
                status as WineStatus | undefined,
              ),
            }
          : {}),
      },
    });

    return Response.json({ wine });
  } catch (error) {
    console.error('PATCH /api/wines error:', error);

    return Response.json(
      {
        error: 'Errore durante modifica vino',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json(
        { error: 'id vino mancante' },
        { status: 400 },
      );
    }

    await prisma.inventoryMovement.deleteMany({
      where: { wineId: id },
    });

    await prisma.wine.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/wines error:', error);

    return Response.json(
      {
        error: 'Errore durante eliminazione vino',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}