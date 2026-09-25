import type { Prisma } from '@prisma/client';
import { localPrisma, mirrorToLocal, prisma } from '@/lib/prisma';
import { jsonResponse, optionsResponse } from '@/lib/route';

type IncidentWithNames = Prisma.IncidentGetPayload<{
  include: {
    Tecnico: { select: { nombre: true } };
    Cliente: { select: { nombre: true } };
  };
}>;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tecnicoIdParam = searchParams.get('tecnicoId');
    const clienteIdParam = searchParams.get('clienteId');
    
    const whereClause: any = {};
    if (tecnicoIdParam) whereClause.tecnicoId = Number(tecnicoIdParam);
    if (clienteIdParam) whereClause.clienteId = Number(clienteIdParam);

    let incidents: IncidentWithNames[];
    try {
      incidents = await prisma.incident.findMany({
        where: whereClause,
        orderBy: { id: 'desc' },
        include: {
          Tecnico: { select: { nombre: true } },
          Cliente: { select: { nombre: true } }
        }
      });
    } catch (error) {
      console.error('Error consultando Supabase en incidents:', error);
      if (!localPrisma) throw error;
      incidents = await localPrisma.incident.findMany({
        where: whereClause,
        orderBy: { id: 'desc' },
        include: {
          Tecnico: { select: { nombre: true } },
          Cliente: { select: { nombre: true } }
        }
      });
    }

    return jsonResponse(
      incidents.map((incident) => ({
        id: incident.id,
        title: incident.titulo,
        description: incident.descripcion,
        categoria: incident.categoria,
        severity: incident.severidad,
        estado: incident.estado,
        latitud: incident.latitud,
        longitud: incident.longitud,
        latitudInicio: incident.latitudInicio,
        longitudInicio: incident.longitudInicio,
        latitudCierre: incident.latitudCierre,
        longitudCierre: incident.longitudCierre,
        fotoUrl: incident.fotoUrl,
        fotoAntesTecnicoUrl: incident.fotoAntesTecnicoUrl,
        fecha: incident.fecha,
        fechaAsignacion: incident.fechaAsignacion,
        fechaInicio: incident.fechaInicio,
        fechaCierre: incident.fechaCierre,
        tecnicoId: incident.tecnicoId,
        tecnicoNombre: incident.Tecnico?.nombre || null,
        clienteNombre: incident.Cliente?.nombre || null,
        fotoResolucionUrl: incident.fotoResolucionUrl,
        comentarios: incident.comentarios,
        comentarioCliente: incident.comentarioCliente,
        calificacion: incident.calificacion
      }))
    );
  } catch (error: any) {
    return jsonResponse({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'No autorizado - Token ausente' }, { status: 401 });
    }

    const body = await request.json() as any;

    if (!body.title || !body.description) {
      return jsonResponse(
        { error: 'El titulo y la descripcion son obligatorios' },
        { status: 400 }
      );
    }

    const nuevaIncidencia = await prisma.incident.create({
      data: {
        titulo: body.title,
        descripcion: body.description,
        categoria: body.categoria || null,
        severidad: body.severity || 'Medium',
        latitud: body.latitud || null,
        longitud: body.longitud || null,
        fotoUrl: body.fotoEvidencia || null,
        clienteId: body.clienteId ? Number(body.clienteId) : null,
      },
    });

    await mirrorToLocal('incident.create', async (db) => {
      await db.incident.create({
        data: {
          id: nuevaIncidencia.id,
          titulo: nuevaIncidencia.titulo,
          descripcion: nuevaIncidencia.descripcion,
          categoria: nuevaIncidencia.categoria,
          severidad: nuevaIncidencia.severidad,
          estado: nuevaIncidencia.estado,
          latitud: nuevaIncidencia.latitud,
          longitud: nuevaIncidencia.longitud,
          latitudInicio: nuevaIncidencia.latitudInicio,
          longitudInicio: nuevaIncidencia.longitudInicio,
          latitudCierre: nuevaIncidencia.latitudCierre,
          longitudCierre: nuevaIncidencia.longitudCierre,
          fotoUrl: nuevaIncidencia.fotoUrl,
          fotoAntesTecnicoUrl: nuevaIncidencia.fotoAntesTecnicoUrl,
          comentarioCliente: nuevaIncidencia.comentarioCliente,
          calificacion: nuevaIncidencia.calificacion,
          fecha: nuevaIncidencia.fecha,
          fechaAsignacion: nuevaIncidencia.fechaAsignacion,
          fechaInicio: nuevaIncidencia.fechaInicio,
          fechaCierre: nuevaIncidencia.fechaCierre,
          clienteId: nuevaIncidencia.clienteId,
        },
      });
      await db.$executeRawUnsafe(
        'select setval(pg_get_serial_sequence(\'"Incident"\', \'id\'), (select coalesce(max(id), 1) from "Incident"))'
      );
    });

    return jsonResponse({ success: true, data: nuevaIncidencia }, { status: 201 });
  } catch (error: any) {
    return jsonResponse({ error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return optionsResponse();
}
