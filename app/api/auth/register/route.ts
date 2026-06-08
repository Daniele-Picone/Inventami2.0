import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Resend } from 'resend';

type RegisterRole = 'MANAGER' | 'SOMMELIER' | 'STAFF';

function generateInviteKey() {
  return `WC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function makeRestaurantLogo(value: string) {
  return value
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nome = String(body.nome || '').trim();
    const cognome = String(body.cognome || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const role = String(body.role || '') as RegisterRole;

    const companyName = String(body.companyName || body.struttura || '').trim();
    const restaurantName = String(body.restaurantName || '').trim();

    const inviteKey = String(body.inviteKey || body.companyKey || '')
      .trim()
      .toUpperCase();

    if (!nome || !cognome || !email || !password || !role) {
      return Response.json(
        { error: 'Compila tutti i campi obbligatori' },
        { status: 400 },
      );
    }

    if (!['MANAGER', 'SOMMELIER', 'STAFF'].includes(role)) {
      return Response.json(
        { error: 'Ruolo non valido' },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return Response.json(
        { error: 'La password deve avere almeno 8 caratteri' },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return Response.json(
        { error: 'Esiste già un account con questa email' },
        { status: 409 },
      );
    }

    let companyId = '';
    let createdInviteKey: string | null = null;

    if (role === 'MANAGER') {
      if (!companyName) {
        return Response.json(
          { error: 'Il nome società è obbligatorio per il manager' },
          { status: 400 },
        );
      }

      let newInviteKey = generateInviteKey();

      const existingCompanyKey = await prisma.company.findUnique({
        where: { inviteKey: newInviteKey },
      });

      if (existingCompanyKey) {
        newInviteKey = generateInviteKey();
      }

      const finalRestaurantName = restaurantName || companyName;

      const company = await prisma.company.create({
        data: {
          name: companyName,
          inviteKey: newInviteKey,
          restaurants: {
            create: {
              name: finalRestaurantName,
              type: 'Ristorante',
              city: '',
              address: '',
              logo: makeRestaurantLogo(finalRestaurantName),
              color: '#7B2D3E',
            },
          },
        },
      });

      companyId = company.id;
      createdInviteKey = company.inviteKey;
    }

    if (role === 'STAFF' || role === 'SOMMELIER') {
      if (!inviteKey) {
        return Response.json(
          {
            error:
              'Per registrarti come staff o sommelier devi inserire il codice invito',
          },
          { status: 400 },
        );
      }

      const company = await prisma.company.findUnique({
        where: {
          inviteKey,
        },
      });

      if (!company) {
        return Response.json(
          { error: 'Codice invito non valido' },
          { status: 404 },
        );
      }

      companyId = company.id;
      createdInviteKey = company.inviteKey;
    }

    if (!companyId) {
      return Response.json(
        { error: 'Impossibile determinare la società di appartenenza' },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        nome,
        cognome,
        email,
        password: hashedPassword,
        role,
        companyId,
        verified: false,
      },
      include: {
        company: true,
      },
    });

    const code = generateVerificationCode();

    await prisma.verificationCode.deleteMany({
      where: { email },
    });

    await prisma.verificationCode.create({
      data: {
        email,
        code,
        expiresAt: new Date(Date.now() + 1000 * 60 * 15),
      },
    });

    console.log('REGISTER VERIFY CODE:', code);
    console.log('REGISTER EMAIL TO:', email);

    try {
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const fromEmail = 'WineCellar <onboarding@resend.dev>';

        console.log('REGISTER EMAIL FROM:', fromEmail);

        const emailResult = await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: 'Codice di verifica WineCellar',
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6">
              <h2>Benvenuto in WineCellar</h2>
              <p>Il tuo codice di verifica è:</p>
              <div style="font-size:28px;font-weight:700;letter-spacing:4px">
                ${code}
              </div>
              <p>Il codice scade tra 15 minuti.</p>
            </div>
          `,
        });

        if (emailResult.error) {
          console.error('RESEND ERROR:', emailResult.error);
        }
      } else {
        console.warn('RESEND_API_KEY mancante. Codice verifica:', code);
      }
    } catch (emailError) {
      console.error('Errore invio email verifica:', emailError);
    }

    return Response.json(
      {
        success: true,
        message: 'Registrazione completata. Controlla la tua email.',
        devCode: process.env.NODE_ENV !== 'production' ? code : undefined,
        user: {
          id: user.id,
          nome: user.nome,
          cognome: user.cognome,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          companyName: user.company.name,
          inviteKey: role === 'MANAGER' ? createdInviteKey : null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/auth/register error:', error);

    return Response.json(
      {
        error: 'Errore durante la registrazione',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}