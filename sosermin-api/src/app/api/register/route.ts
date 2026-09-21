import bcrypt from 'bcryptjs';
import { mirrorToLocal, prisma } from '@/lib/prisma';
import { jsonResponse, optionsResponse } from '@/lib/route';

export async function POST(req: Request) {
  try {
    const body = await req.json() as any;

    const nombre = String(body.nombre || '').trim();
    const cedula = String(body.cedula || body.usuario || '').trim();
    const email = String(body.email || '').trim() || null;
    const password = body.password || body.pass;
    const requestedRole = String(body.rol || 'CLIENTE')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
    const rol = requestedRole === 'TECNICO' ? 'TECNICO' : 'CLIENTE';

    if (!nombre || !cedula || !password) {
      return jsonResponse(
        { mensaje: 'Nombre, cedula y contrasena son obligatorios' },
        { status: 400 }
      );
    }

    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        OR: [
          { usuario: cedula },
          { cedula },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (usuarioExistente) {
      return jsonResponse(
        { mensaje: 'La cedula o el correo ya estan registrados' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        cedula,
        email,
        usuario: cedula,
        password: hashedPassword,
        rol,
      },
    });

    await mirrorToLocal('usuario.create', async (db) => {
      await db.usuario.create({
        data: {
          id: nuevoUsuario.id,
          nombre: nuevoUsuario.nombre,
          cedula: nuevoUsuario.cedula,
          email: nuevoUsuario.email,
          usuario: nuevoUsuario.usuario,
          password: nuevoUsuario.password,
          rol: nuevoUsuario.rol,
        },
      });
      await db.$executeRawUnsafe(
        'select setval(pg_get_serial_sequence(\'"Usuario"\', \'id\'), (select coalesce(max(id), 1) from "Usuario"))'
      );
    });

    return jsonResponse(
      {
        mensaje: 'Usuario registrado exitosamente',
        usuario: {
          id: nuevoUsuario.id,
          nombre: nuevoUsuario.nombre,
          cedula: nuevoUsuario.cedula,
          email: nuevoUsuario.email,
          usuario: nuevoUsuario.usuario,
          rol: nuevoUsuario.rol,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error critico en registro:', error);
    return jsonResponse(
      { mensaje: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return optionsResponse();
}
