import { NextResponse } from 'next/server';
import { adminOperations, ProductCreateInput } from '@/lib/shopify-admin'; // Importar ProductCreateInput

export async function GET(request: Request) {
  try {
    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url);
    // Ler collectionId em vez de collectionHandle
    const collectionId = searchParams.get('collectionId'); 
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    
    // Buscar produtos, passando collectionId se existir
    const products = await adminOperations.getProducts(limit, collectionId || undefined); 
    return NextResponse.json({ products });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('Erro na rota GET /api/admin/products:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar produtos', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data: ProductCreateInput = await request.json(); // Usar a interface importada
    // Chamar a função de criação de produto do lado do servidor
    const result = await adminOperations.createProduct(data);
    return NextResponse.json(result);
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('Erro na rota POST /api/admin/products:', error);
    return NextResponse.json(
      { error: 'Falha ao criar produto', details: error.message },
      { status: 500 }
    );
  }
}
