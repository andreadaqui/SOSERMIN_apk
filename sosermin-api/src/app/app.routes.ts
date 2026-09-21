import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Cuerpo recibido en el registro:', body);

    const { nombre, cedula, email, password, rol } = body;
    const identifier = email || cedula;

    if (!identifier || !password || !nombre) {
      return NextResponse.json(
        { mensaje: 'Nombre, correo/cédula y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: {
        usuario: identifier,
      },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { mensaje: 'El usuario, correo o cédula ya están registrados' },
        { status: 400 }
      );
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el nuevo usuario en PostgreSQL
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        usuario: identifier,
        password: hashedPassword,
        rol: rol || 'Administrador',
      },
    });

    return NextResponse.json(
      {
        mensaje: 'Usuario registrado exitosamente',
        usuario: {
          id: nuevoUsuario.id,
          nombre: nuevoUsuario.nombre,
          usuario: nuevoUsuario.usuario,
          rol: nuevoUsuario.rol,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error crítico en el registro:', error);
    return NextResponse.json(
      { mensaje: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}