import type { NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { validarToken, AuthenticatedRequest } from '../../../middleware/auth';

export default async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const empleadoId = Number(id);

  if (isNaN(empleadoId)) {
    return res.status(400).json({ mensaje: 'ID no válido' });
  }

  // GET público o protegido según requerimiento
  if (req.method === 'GET') {
    const empleado = await prisma.empleado.findUnique({ where: { id: empleadoId } });
    return res.status(200).json(empleado);
  }

  // Proteger escrituras (PUT y DELETE)
  if (req.method === 'PUT' || req.method === 'DELETE') {
    const esValido = validarToken(req, res);
    if (!esValido) return; // Se corta la ejecución si falla el token

    if (req.method === 'PUT') {
      const empleadoActualizado = await prisma.empleado.update({
        where: { id: empleadoId },
        data: req.body,
      });
      return res.status(200).json(empleadoActualizado);
    }

    if (req.method === 'DELETE') {
      await prisma.empleado.delete({ where: { id: empleadoId } });
      return res.status(200).json({ mensaje: 'Empleado eliminado correctamente' });
    }
  }

  return res.status(405).json({ mensaje: 'Método no permitido' });
}