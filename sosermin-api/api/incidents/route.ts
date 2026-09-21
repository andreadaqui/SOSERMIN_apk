import { NextResponse } from 'next/server';

// Permite las peticiones de prueba (CORS Preflight)
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Recibe los datos de la incidencia desde tu app Ionic
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Datos de la incidencia recibidos:', body);

    // Aquí puedes guardar los datos en tu base de datos más adelante

    return NextResponse.json(
      { message: 'Incidencia guardada con éxito', data: body },
      {
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}