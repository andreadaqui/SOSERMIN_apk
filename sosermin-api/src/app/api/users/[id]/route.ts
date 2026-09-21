import bcrypt from 'bcryptjs';
import { localPrisma, prisma } from '@/lib/prisma';
import { jsonResponse, optionsResponse } from '@/lib/route';

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

async function getUserId(context: RouteContext) {
  const { id } = await context.params;
  const userId = Number(id);

  if (!Number.isInteger(userId)) {
    return null;
  }

  return userId;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const userId = await getUserId(context);

    if (!userId) {
      return jsonResponse({ error: 'ID invalido' }, { status: 400 });
    }

    const body = await request.json() as any;
    const dataToUpdate: any = {};

    if (body.nombre !== undefined) {
      const nombre = String(body.nombre || '').trim();
      if (!nombre) {
        return jsonResponse({ mensaje: 'El nombre es obligatorio' }, { status: 400 });
      }
      dataToUpdate.nombre = nombre;
    }

    if (body.cedula !== undefined) {
      const cedula = String(body.cedula || '').trim();
      if (!cedula) {
        return jsonResponse({ mensaje: 'La cedula es obligatoria' }, { status: 400 });
      }
      dataToUpdate.cedula = cedula;
      dataToUpdate.usuario = cedula;
    }

    if (body.email !== undefined) {
      dataToUpdate.email = String(body.email || '').trim() || null;
    }

    if (body.rol !== undefined) {
      dataToUpdate.rol = normalizeRole(body.rol);
    }

    if (body.activo !== undefined) {
      dataToUpdate.activo = Boolean(body.activo);
    }

    if (body.password !== undefined || body.pass !== undefined) {
      const password = String(body.password || body.pass || '').trim();
      if (password) {
        dataToUpdate.password = await bcrypt.hash(password, 10);
      }
    }

    const usuario = await prisma.usuario.update({
      where: { id: userId },
      data: dataToUpdate,
      select: userSelect,
    });

    if (localPrisma) {
      try {
        await localPrisma.usuario.update({
          where: { id: userId },
          data: dataToUpdate,
        });
      } catch (error) {
        console.error('No se pudo replicar usuario actualizado en PostgreSQL local:', error);
      }
    }

    return jsonResponse(usuario);
  } catch (error: any) {
    const message = error?.code === 'P2002'
      ? 'La cedula o el correo ya estan registrados'
      : error.message;
    const status = error?.code === 'P2002' ? 400 : 500;
    return jsonResponse({ mensaje: message, error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await getUserId(context);

    if (!userId) {
      return jsonResponse({ error: 'ID invalido' }, { status: 400 });
    }

    await prisma.usuario.delete({ where: { id: userId } });

    if (localPrisma) {
      try {
        await localPrisma.usuario.delete({ where: { id: userId } });
      } catch (error) {
        console.error('No se pudo replicar usuario eliminado en PostgreSQL local:', error);
      }
    }

    return jsonResponse({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2003') {
      return jsonResponse(
        { mensaje: 'No se puede eliminar este usuario porque tiene solicitudes relacionadas.' },
        { status: 409 }
      );
    }

    return jsonResponse({ error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return optionsResponse();
}
