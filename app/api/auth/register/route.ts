import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateCompanyKey() {
  return `WC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      nome,
      cognome,
      email,
      password,
      struttura,
      role,
      companyKey,
    } = body;

    if (!nome || !cognome || !email || !password || !role) {
      return Response.json(
        { error: 'Compila tutti i campi obbligatori' },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return Response.json(
        { error: 'Email già registrata' },
        { status: 400 },
      );
    }

    let companyId: string | undefined;
    let inviteKey: string | undefined;

    if (role === 'MANAGER') {
      if (!struttura) {
        return Response.json(
          { error: 'Nome azienda obbligatorio per il manager' },
          { status: 400 },
        );
      }

      const company = await prisma.company.create({
        data: {
          name: struttura,
          inviteKey: generateCompanyKey(),
        },
      });

      companyId = company.id;
      inviteKey = company.inviteKey;
    } else {
      if (!companyKey) {
        return Response.json(
          { error: 'Codice azienda obbligatorio per collaboratori' },
          { status: 400 },
        );
      }

      const company = await prisma.company.findUnique({
        where: { inviteKey: companyKey },
      });

      if (!company) {
        return Response.json(
          { error: 'Codice azienda non valido' },
          { status: 400 },
        );
      }

      companyId = company.id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        nome,
        cognome,
        email,
        password: hashedPassword,
        role,
        companyId,
      },
    });

    const code = generateCode();

    await prisma.verificationCode.deleteMany({
      where: { email },
    });

    await prisma.verificationCode.create({
      data: {
        email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: 'Codice di conferma WineCellar',
      html: `
        <div style="font-family: Arial, sans-serif; color: #1C1009;">
          <h2>WineCellar</h2>
          <p>Ciao ${nome},</p>
          <p>usa questo codice per confermare la tua iscrizione:</p>
          <h1 style="letter-spacing: 6px; font-size: 32px;">${code}</h1>
          <p>Il codice scade tra 10 minuti.</p>
        </div>
      `,
    });

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      message: 'Codice inviato via email',
      email,
      inviteKey,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Errore durante la registrazione' },
      { status: 500 },
    );
  }
}