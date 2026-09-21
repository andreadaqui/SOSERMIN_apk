import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma'; // Verifica que la ruta a lib/prisma sea correcta

// OJO: Es imperativo usar "export default async function handler"
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const { nombre, usuario, password, rol } = req.body;

      if (!nombre || !usuario || !password || !rol) {
        return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      const nuevoUsuario = await prisma.usuario.create({
        data: {
          nombre,
          usuario,
          password: hashedPassword,
          rol,
        },
      });

      return res.status(201).json({
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        usuario: nuevoUsuario.usuario,
        rol: nuevoUsuario.rol,
      });
    } catch (error) {
      return res.status(500).json({ mensaje: 'Error al crear usuario o el usuario ya existe' });
    }
  }

  if (req.method === 'GET') {
    try {
      const usuarios = await prisma.usuario.findMany({
        select: {
          id: true,
          nombre: true,
          usuario: true,
          rol: true,
        },
      });
      return res.status(200).json(usuarios);
    } catch (error) {
      return res.status(500).json({ mensaje: 'Error al obtener usuarios' });
    }
  }

  return res.status(405).json({ mensaje: 'Método no permitido' });
}