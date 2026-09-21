import { jsonResponse, optionsResponse } from '@/lib/route';
import { localPrisma, mirrorToLocal, prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getIncidentId(context: RouteContext) {
  const { id } = await context.params;
  const incidentId = Number(id);

  if (!Number.isInteger(incidentId)) {
    return null;
  }

  return incidentId;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const incidentId = await getIncidentId(context);

    if (!incidentId) {
      return jsonResponse({ error: 'ID invalido' }, { status: 400 });
    }

    let incident;
    try {
      incident = await prisma.incident.findUnique({
        where: { id: incidentId },
        include: {
          Tecnico: { select: { nombre: true } },
          Cliente: { select: { nombre: true } },
        },
      });
    } catch (error) {
      console.error('Error consultando Supabase en incident detail:', error);
      if (!localPrisma) {
        throw error;
      }
      incident = await localPrisma.incident.findUnique({
        where: { id: incidentId },
        include: {
          Tecnico: { select: { nombre: true } },
          Cliente: { select: { nombre: true } },
        },
      });
    }

    if (!incident) {
      return jsonResponse({ error: 'Incidencia no encontrada' }, { status: 404 });
    }

    return jsonResponse({
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
      fotoResolucionUrl: incident.fotoResolucionUrl,
      comentarios: incident.comentarios,
      comentarioCliente: incident.comentarioCliente,
      calificacion: incident.calificacion,
      fecha: incident.fecha,
      fechaAsignacion: incident.fechaAsignacion,
      fechaInicio: incident.fechaInicio,
      fechaCierre: incident.fechaCierre,
      clienteId: incident.clienteId,
      clienteNombre: incident.Cliente?.nombre || null,
      tecnicoId: incident.tecnicoId,
      tecnicoNombre: incident.Tecnico?.nombre || null,
    });
  } catch (error: any) {
    return jsonResponse({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const incidentId = await getIncidentId(context);

    if (!incidentId) {
      return jsonResponse({ error: 'ID invalido' }, { status: 400 });
    }

    const body = await request.json() as any;
    const now = new Date();
    const dataToUpdate: any = {};

    if (body.tecnicoId !== undefined) {
      dataToUpdate.tecnicoId = body.tecnicoId ? Number(body.tecnicoId) : null;
      dataToUpdate.estado = 'Asignado';
      dataToUpdate.fechaAsignacion = now;
    }

    if (body.estado !== undefined) {
      dataToUpdate.estado = body.estado;

      if (body.estado === 'Asignado' && body.fechaAsignacion === undefined) {
        dataToUpdate.fechaAsignacion = now;
      }

      if (body.estado === 'En Proceso' && body.fechaInicio === undefined) {
        dataToUpdate.fechaInicio = now;
      }

      if (body.estado === 'Finalizado') {
        if (!body.comentarios || !body.fotoResolucionUrl) {
          return jsonResponse(
            { mensaje: 'Para finalizar se requieren comentario y evidencia fotografica.' },
            { status: 400 }
          );
        }
        dataToUpdate.fechaCierre = now;
      }
    }

    if (body.comentarios !== undefined) {
      dataToUpdate.comentarios = body.comentarios;
    }

    if (body.comentarioCliente !== undefined) {
      dataToUpdate.comentarioCliente = body.comentarioCliente;
    }

    if (body.fotoResolucionUrl !== undefined) {
      dataToUpdate.fotoResolucionUrl = body.fotoResolucionUrl;
    }

    if (body.fotoAntesTecnicoUrl !== undefined) {
      dataToUpdate.fotoAntesTecnicoUrl = body.fotoAntesTecnicoUrl;
    }

    if (body.latitudInicio !== undefined) {
      dataToUpdate.latitudInicio = body.latitudInicio === null ? null : Number(body.latitudInicio);
    }

    if (body.longitudInicio !== undefined) {
      dataToUpdate.longitudInicio = body.longitudInicio === null ? null : Number(body.longitudInicio);
    }

    if (body.latitudCierre !== undefined) {
      dataToUpdate.latitudCierre = body.latitudCierre === null ? null : Number(body.latitudCierre);
    }

    if (body.longitudCierre !== undefined) {
      dataToUpdate.longitudCierre = body.longitudCierre === null ? null : Number(body.longitudCierre);
    }

    if (body.calificacion !== undefined) {
      dataToUpdate.calificacion = body.calificacion ? Number(body.calificacion) : null;
    }

    const updatedIncident = await prisma.incident.update({
      where: { id: incidentId },
      data: dataToUpdate,
    });

    await mirrorToLocal('incident.update', async (db) => {
      await db.incident.update({
        where: { id: incidentId },
        data: dataToUpdate,
      });
    });

    return jsonResponse({ success: true, data: updatedIncident });
  } catch (error: any) {
    return jsonResponse({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const incidentId = await getIncidentId(context);

    if (!incidentId) {
      return jsonResponse({ error: 'ID invalido' }, { status: 400 });
    }

    await prisma.incident.delete({ where: { id: incidentId } });

    await mirrorToLocal('incident.delete', async (db) => {
      await db.incident.delete({ where: { id: incidentId } });
    });

    return jsonResponse({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return jsonResponse({ mensaje: 'Reporte no encontrado.' }, { status: 404 });
    }

    return jsonResponse({ error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return optionsResponse();
}
