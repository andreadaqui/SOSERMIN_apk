import { localPrisma, prisma } from '@/lib/prisma';
import { jsonResponse, optionsResponse } from '@/lib/route';
import bcrypt from 'bcryptjs';

const userSelect = {
  id: true,
  nombre: true,
  cedula: true,
  email: true,
  usuario: true,
  rol: true,
  activo: true,
};

function normalizeRole(value: unknown) {
  const role = String(value || 'CLIENTE')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  if (role === 'ADMIN' || role === 'ADMINISTRADOR' || role === 'SUPERVISOR') {
    return 'ADMIN';
  }

  if (role === 'TECNICO' || role === 'PERSONAL DE CAMPO') {
    return 'TECNICO';
  }

  return 'CLIENTE';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    let users;
    try {
      const whereClause = role ? { rol: role.toUpperCase() } : {};
      users = await prisma.usuario.findMany({
        where: whereClause,
        orderBy: { id: 'asc' },
        select: userSelect,
      });
    } catch (error) {
      console.error('Error consultando Supabase en users:', error);
      if (!localPrisma) {
        throw error;
      }
      const whereClause = role ? { rol: role.toUpperCase() } : {};
      users = await localPrisma.usuario.findMany({
        where: whereClause,
        orderBy: { id: 'asc' },
        select: userSelect,
      });
    }

    return jsonResponse(users);
  } catch (error: any) {
    return jsonResponse({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as any;
    const nombre = String(body.nombre || '').trim();
    const cedula = String(body.cedula || body.usuario || '').trim();
    const email = String(body.email || '').trim() || null;
    const password = String(body.password || body.pass || '').trim();
    const rol = normalizeRole(body.rol);

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
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        cedula,
        email,
        usuario: cedula,
        password: hashedPassword,
        rol,
      },
      select: userSelect,
    });

    if (localPrisma) {
      try {
        await localPrisma.usuario.create({
          data: {
            id: usuario.id,
            nombre,
            cedula,
            email,
            usuario: cedula,
            password: hashedPassword,
            rol,
            activo: usuario.activo,
          },
        });
        await localPrisma.$executeRawUnsafe(
          'select setval(pg_get_serial_sequence(\'"Usuario"\', \'id\'), (select coalesce(max(id), 1) from "Usuario"))'
        );
      } catch (error) {
        console.error('No se pudo replicar usuario creado en PostgreSQL local:', error);
      }
    }

    return jsonResponse(usuario, { status: 201 });
  } catch (error: any) {
    return jsonResponse({ error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return optionsResponse();
}
