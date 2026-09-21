import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'sosermin_secret';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      mensaje: 'Método no permitido',
    });
  }

  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({
        mensaje: 'Usuario y contraseña son obligatorios',
      });
    }

    const usuarioEncontrado = await prisma.usuario.findUnique({
      where: {
        usuario,
      },
    });

    if (!usuarioEncontrado) {
      return res.status(401).json({
        mensaje: 'Usuario o contraseña incorrectos',
      });
    }

    const passwordCorrecta = await bcrypt.compare(
      password,
      usuarioEncontrado.password
    );

    if (!passwordCorrecta) {
      return res.status(401).json({
        mensaje: 'Usuario o contraseña incorrectos',
      });
    }

    const token = jwt.sign(
      {
        id: usuarioEncontrado.id,
        usuario: usuarioEncontrado.usuario,
        rol: usuarioEncontrado.rol,
      },
      JWT_SECRET,
      {
        expiresIn: '15m',
      }
    );

    return res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuarioEncontrado.id,
        nombre: usuarioEncontrado.nombre,
        usuario: usuarioEncontrado.usuario,
        rol: usuarioEncontrado.rol,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error interno del servidor',
    });
  }
}