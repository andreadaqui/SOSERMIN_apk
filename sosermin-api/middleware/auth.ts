import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sosermin_secret';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ mensaje: 'Método no permitido' });
  }

  const { email, pass } = req.body;
  console.log('Datos recibidos desde el móvil:', { email });

  // Validación básica (puedes adaptarla a tu base de datos)
  if (email === 'admin@sosermin.com') {
    // Generamos el token JWT
    const token = jwt.sign({ email, role: 'operator' }, JWT_SECRET, { expiresIn: '8h' });

    // Retornamos el token que la app Ionic espera capturar
    return res.status(200).json({
      token: token,
      mensaje: 'Login exitoso'
    });
  }

  return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
}