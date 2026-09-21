import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { localPrisma, prisma } from '@/lib/prisma';
import { jsonResponse, optionsResponse } from '@/lib/route';

const JWT_SECRET = process.env.JWT_SECRET || 'sosermin_secret';

export async function POST(req: Request) {
  try {
    const body = await req.json() as any;
    const identifier = String(body.usuario || body.cedula || body.email || body.username || '').trim();
    const password = body.password || body.pass;

    if (!identifier || !password) {
      return jsonResponse(
        { mensaje: 'Cedula y contrasena son obligatorias' },
        { status: 400 }
      );
    }

    const where = {
      OR: [
        { usuario: identifier },
        { cedula: identifier },
      ],
    };

    let usuarioEncontrado;
    try {
      usuarioEncontrado = await prisma.usuario.findFirst({ where });
    } catch (error) {
      console.error('Error consultando Supabase en login:', error);
      if (!localPrisma) {
        throw error;
      }
      usuarioEncontrado = await localPrisma.usuario.findFirst({ where });
    }

    if (!usuarioEncontrado) {
      return jsonResponse(
        { mensaje: 'Cedula o contrasena incorrectas' },
        { status: 401 }
      );
    }

    if (usuarioEncontrado.activo === false) {
      return jsonResponse(
        { mensaje: 'La cuenta esta inactiva. Contacta al administrador.' },
        { status: 403 }
      );
    }

    const passwordCorrecta = await bcrypt.compare(password, usuarioEncontrado.password);

    if (!passwordCorrecta) {
      return jsonResponse(
        { mensaje: 'Cedula o contrasena incorrectas' },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        id: usuarioEncontrado.id,
        usuario: usuarioEncontrado.usuario,
        cedula: usuarioEncontrado.cedula,
        rol: usuarioEncontrado.rol,
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return jsonResponse({
      mensaje: 'Inicio de sesion exitoso',
      token,
      usuario: {
        id: usuarioEncontrado.id,
        nombre: usuarioEncontrado.nombre,
        cedula: usuarioEncontrado.cedula,
        email: usuarioEncontrado.email,
        usuario: usuarioEncontrado.usuario,
        rol: usuarioEncontrado.rol,
        activo: usuarioEncontrado.activo,
      },
    });
  } catch (error) {
    console.error('Error critico en login:', error);
    return jsonResponse(
      { mensaje: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return optionsResponse();
}
