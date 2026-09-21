import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET: Listar todos los empleados sin include complejo
  if (req.method === 'GET') {
    try {
      const empleados = await prisma.empleado.findMany();
      return res.status(200).json(empleados);
    } catch (error: any) {
      console.error("Error en Prisma GET:", error);
      return res.status(500).json({ 
        mensaje: 'Error al obtener empleados', 
        errorDetalle: error.message 
      });
    }
  }

  // POST: Crear un nuevo empleado
  if (req.method === 'POST') {
    try {
      const { cedula, nombres, apellidos, telefono, cargo } = req.body;

      if (!cedula || !nombres || !apellidos) {
        return res.status(400).json({ mensaje: 'Cédula, nombres y apellidos son obligatorios' });
      }

      const nuevoEmpleado = await prisma.empleado.create({
        data: {
          cedula,
          nombres,
          apellidos,
          telefono,
          cargo,
        },
      });

      return res.status(201).json(nuevoEmpleado);
    } catch (error: any) {
      console.error("Error en Prisma POST:", error);
      return res.status(500).json({ 
        mensaje: 'Error al registrar el empleado', 
        errorDetalle: error.message 
      });
    }
  }

  return res.status(405).json({ mensaje: 'Método no permitido' });
}