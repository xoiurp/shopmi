import { NextResponse } from 'next/server';
import { adminOperations } from '@/lib/shopify-admin';

export async function POST(request: Request) {
  try {
    const { title, description, image } = await request.json();
    // Chamar a função de criação de coleção do lado do servidor
    const result = await adminOperations.createCollection(title, description, image);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro na rota /api/admin/collections:', error);
    return NextResponse.json(
      { error: 'Falha ao criar coleção', details: error.message },
      { status: 500 }
    );
  }
}
