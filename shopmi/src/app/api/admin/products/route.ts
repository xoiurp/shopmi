import { NextResponse } from 'next/server';
import { adminOperations } from '@/lib/shopify-admin';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // Chamar a função de criação de produto do lado do servidor
    const result = await adminOperations.createProduct(data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro na rota /api/admin/products:', error);
    return NextResponse.json(
      { error: 'Falha ao criar produto', details: error.message },
      { status: 500 }
    );
  }
}
