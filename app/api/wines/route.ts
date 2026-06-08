import { prisma } from '@/lib/prisma';

type WineCategory = 'ROSSO' | 'BIANCO' | 'ROSE' | 'SPUMANTE' | 'DOLCE';
type WineStatus = 'DISPONIBILE' | 'ESAURIMENTO' | 'ESAURITO' | 'ARCHIVIATO';

function resolveStatus(
  stock: number,
  minStock: number,
  status?: WineStatus,
): WineStatus {
  if (status) return status;
  if (stock <= 0) return 'ESAURITO';
  if (stock <= minStock) return 'ESAURIMENTO';
  return 'DISPONIBILE';
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const companyId = searchParams.get('companyId');
    const restaurantId = searchParams.get('restaurantId');

    if (!companyId) {
      return Response.json({ error: 'companyId mancante' }, { status: 400 });
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

    const name = String(body.name || '').trim();
    const producer = String(body.producer || '').trim();
    const region = String(body.region || '').trim();
    const denomination = String(body.denomination || '').trim();
    const vintage = Number(body.vintage);
    const category = String(body.category || '') as WineCategory;

    const stock = Number(body.stock || 0);
    const minStock = Number(body.minStock || 3);

    const purchasePrice = Number(body.purchasePrice || 0);
    const bottlePrice = Number(body.bottlePrice || 0);

    const availableByGlass = Boolean(body.availableByGlass);
    const glassPrice = availableByGlass ? Number(body.glassPrice || 0) : 0;

    const supplier = String(body.supplier || '').trim();

    const alcohol = Number(body.alcohol || 0);
    const format = String(body.format || '0.75L').trim();

    const notes = String(body.notes || '').trim();
    const pairings = String(body.pairings || '').trim();
    const grapeVarieties = String(body.grapeVarieties || '').trim();

    const inMenu = Boolean(body.inMenu);
    const restaurantId = String(body.restaurantId || '').trim();

    if (
      !name ||
      !producer ||
      !region ||
      !denomination ||
      !vintage ||
      !category ||
      !restaurantId
    ) {
      return Response.json(
        { error: 'Compila tutti i campi obbligatori del vino' },
        { status: 400 },
      );
    }

    const wine = await prisma.wine.create({
      data: {
        name,
        producer,
        region,
        denomination,
        vintage,
        category,

        stock,
        minStock,
        purchasePrice,
        bottlePrice,
        glassPrice,
        availableByGlass,

        supplier,

        alcohol,
        format,
        notes,
        pairings,
        grapeVarieties,

        status: resolveStatus(stock, minStock),
        inMenu,

        restaurantId,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
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

    const id = String(body.id || '').trim();

    if (!id) {
      return Response.json({ error: 'id vino mancante' }, { status: 400 });
    }

    const existingWine = await prisma.wine.findUnique({
      where: { id },
    });

    if (!existingWine) {
      return Response.json({ error: 'Vino non trovato' }, { status: 404 });
    }

    const nextStock =
      body.stock !== undefined ? Number(body.stock) : existingWine.stock;

    const nextMinStock =
      body.minStock !== undefined
        ? Number(body.minStock || 3)
        : existingWine.minStock;

    const nextAvailableByGlass =
      body.availableByGlass !== undefined
        ? Boolean(body.availableByGlass)
        : existingWine.availableByGlass;

    const wine = await prisma.wine.update({
      where: { id },
      data: {
        ...(body.name !== undefined
          ? { name: String(body.name).trim() }
          : {}),
        ...(body.producer !== undefined
          ? { producer: String(body.producer).trim() }
          : {}),
        ...(body.region !== undefined
          ? { region: String(body.region).trim() }
          : {}),
        ...(body.denomination !== undefined
          ? { denomination: String(body.denomination).trim() }
          : {}),
        ...(body.vintage !== undefined
          ? { vintage: Number(body.vintage) }
          : {}),
        ...(body.category !== undefined
          ? { category: String(body.category) as WineCategory }
          : {}),

        ...(body.stock !== undefined ? { stock: Number(body.stock) } : {}),
        ...(body.minStock !== undefined
          ? { minStock: Number(body.minStock || 3) }
          : {}),
        ...(body.purchasePrice !== undefined
          ? { purchasePrice: Number(body.purchasePrice || 0) }
          : {}),
        ...(body.bottlePrice !== undefined
          ? { bottlePrice: Number(body.bottlePrice || 0) }
          : {}),

        ...(body.availableByGlass !== undefined
          ? {
              availableByGlass: nextAvailableByGlass,
              glassPrice: nextAvailableByGlass
                ? Number(body.glassPrice || 0)
                : 0,
            }
          : body.glassPrice !== undefined
            ? { glassPrice: Number(body.glassPrice || 0) }
            : {}),

        ...(body.supplier !== undefined
          ? { supplier: String(body.supplier).trim() }
          : {}),

        ...(body.alcohol !== undefined
          ? { alcohol: Number(body.alcohol || 0) }
          : {}),
        ...(body.format !== undefined
          ? { format: String(body.format).trim() }
          : {}),
        ...(body.notes !== undefined
          ? { notes: String(body.notes).trim() }
          : {}),
        ...(body.pairings !== undefined
          ? { pairings: String(body.pairings).trim() }
          : {}),
        ...(body.grapeVarieties !== undefined
          ? { grapeVarieties: String(body.grapeVarieties).trim() }
          : {}),

        ...(body.inMenu !== undefined ? { inMenu: Boolean(body.inMenu) } : {}),
        ...(body.restaurantId !== undefined
          ? { restaurantId: String(body.restaurantId) }
          : {}),

        status: resolveStatus(
          nextStock,
          nextMinStock,
          body.status as WineStatus | undefined,
        ),
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
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
      return Response.json({ error: 'id vino mancante' }, { status: 400 });
    }

    await prisma.inventoryMovement.deleteMany({
      where: {
        wineId: id,
      },
    });

    await prisma.wine.delete({
      where: {
        id,
      },
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