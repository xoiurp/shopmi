import { NextResponse } from 'next/server';
import { adminOperations, ProductCreateInput } from '@/lib/shopify-admin'; // Importar ProductCreateInput

export async function POST(request: Request) {
  try {
    const data: ProductCreateInput = await request.json(); // Usar a interface importada
    // Chamar a função de criação de produto do lado do servidor
    const result = await adminOperations.createProduct(data);
    return NextResponse.json(result);
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('Erro na rota /api/admin/products:', error);
    return NextResponse.json(
      { error: 'Falha ao criar produto', details: error.message },
      { status: 500 }
    );
  }
}
