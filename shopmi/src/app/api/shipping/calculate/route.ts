import { NextResponse } from 'next/server';
import melhorEnvio, { 
  calculateShipment, 
  type ShippingCalculatePayload, 
  type Address, 
  type PackageDimensions 
} from '@/lib/melhorenvio';

// Definindo tipos para clareza
interface CalculateShippingRequest {
  cep: string;
  // Não precisamos mais receber 'product' se usarmos dimensões padrão
}

export async function POST(request: Request) {
  try {
    // 1. Parse do corpo da requisição
    const { cep } = (await request.json()) as CalculateShippingRequest;

    // Validação básica do CEP (pode ser mais robusta)
    if (!cep || !/^\d{5}-?\d{3}$/.test(cep)) {
      return NextResponse.json({ error: 'CEP inválido.' }, { status: 400 });
    }

    // 2. Definir CEP de origem e dimensões/peso padrão
    const originPostalCode = '13802-170';
    const defaultPackage: PackageDimensions = {
      weight: 0.25, // 250g
      width: 12,    // 12cm
      height: 2,     // 2cm
      length: 17,    // 17cm
    };

    // 3. Chamar a API do Melhor Envio para calcular o frete
    console.log('Calculando frete para CEP:', cep.replace('-', ''));
    console.log('Payload para Melhor Envio:', {
      from: { postal_code: originPostalCode },
      to: { postal_code: cep.replace('-', '') },
      package: defaultPackage,
    });

    let shippingOptions: any; // Definir como any temporariamente para log
    try {
      // Payload completo para o cálculo de frete
      const payload: ShippingCalculatePayload = {
        from: { postal_code: originPostalCode },
        to: { postal_code: cep.replace('-', '') }, // Remover hífen se houver
        package: defaultPackage,
        services: '1,2', // Especificando PAC (1) e SEDEX (2)
        options: {
          insurance_value: 100.00, // Valor segurado
          receipt: false,          // Aviso de recebimento
          own_hand: false,         // Mão própria
          collect: false           // Coleta
        }
      };

      console.log('Chamando API com payload:', JSON.stringify(payload, null, 2));
      
      // Chamar a API do Melhor Envio diretamente
      shippingOptions = await calculateShipment(payload);
      
      console.log('Resposta da API Melhor Envio:', JSON.stringify(shippingOptions, null, 2)); // Log detalhado da resposta
    } catch (sdkError: any) {
      console.error('Erro direto da API Melhor Envio:', sdkError);
      
      // Extrair mais detalhes do erro para depuração
      let errorDetails = {
        message: sdkError.message || 'Erro desconhecido',
        stack: sdkError.stack,
        status: sdkError.response?.status,
        statusText: sdkError.response?.statusText,
        data: sdkError.response?.data
      };
      
      console.error('Detalhes do erro:', JSON.stringify(errorDetails, null, 2));
      
      // Se for erro 401 (Unauthorized), adicionar informações sobre o token
      if (sdkError.response?.status === 401) {
        console.error('Erro de autenticação (401). Verifique se o token está correto e não expirou.');
        console.error('Client ID usado:', process.env.MELHOR_ENVIO_CLIENT_ID);
        // Não logar o token completo por segurança
        console.error('Token (primeiros 10 caracteres):', 
          process.env.MELHOR_ENVIO_TOKEN ? process.env.MELHOR_ENVIO_TOKEN.substring(0, 10) + '...' : 'não definido');
      }
      
      // Retorna o erro para o cliente para depuração
      return NextResponse.json({
        error: 'Erro na chamada da API Melhor Envio.',
        details: errorDetails
      }, { status: 502 }); // 502 Bad Gateway pode ser mais apropriado
    }

    // 4. Verificar a resposta do Melhor Envio (após a chamada bem-sucedida)
    let hasError = false;
    let errorDetails = null;

    if (!shippingOptions) {
      hasError = true;
      errorDetails = 'Resposta inválida da API Melhor Envio.';
      console.error(errorDetails);
    } else if (!Array.isArray(shippingOptions) && shippingOptions.error) {
      // Caso a resposta seja um objeto de erro diretamente
      hasError = true;
      errorDetails = shippingOptions.error;
      console.error('Erro retornado pela API Melhor Envio (objeto):', errorDetails);
    } else if (Array.isArray(shippingOptions)) {
      if (shippingOptions.length === 0) {
        // Resposta é um array vazio - pode não ser um erro, apenas sem opções
        console.warn('Nenhuma opção de frete retornada pela API Melhor Envio (array vazio).');
        // Não definimos como erro, apenas retornaremos array vazio
      } else if (shippingOptions.every((opt: any) => opt && opt.error)) {
        // Só consideramos erro se TODAS as opções tiverem erro
        hasError = true;
        errorDetails = 'Nenhuma opção de frete disponível para este CEP.';
        console.error('Todos os serviços retornaram erro:', errorDetails);
      } else if (shippingOptions.some((opt: any) => opt && opt.error)) {
        // Se apenas algumas opções tiverem erro, logamos mas não consideramos erro geral
        const errorOption = shippingOptions.find((opt: any) => opt && opt.error);
        console.warn('Alguns serviços não estão disponíveis:', errorOption?.error);
      }
    }

    // Se houve algum erro detectado nos passos acima (todos os serviços indisponíveis)
    if (hasError) {
      return NextResponse.json({ error: 'Erro ao calcular frete com Melhor Envio.', details: errorDetails }, { status: 500 });
    }

    // 5. Retornar as opções de frete calculadas (se não houve erro)
    // Filtra apenas opções válidas (sem erro e com preço) - Ajustado para verificar erro em cada opção
    const validOptions = Array.isArray(shippingOptions)
      ? shippingOptions.filter((option: any) => option && !option.error && option.price) // Garante que 'option' existe
      : [];

    console.log('Opções de frete válidas:', JSON.stringify(validOptions, null, 2));
    return NextResponse.json(validOptions);

  } catch (error: any) {
    // Este catch agora pega erros *antes* da chamada do SDK ou erros inesperados gerais
    console.error('Erro interno GERAL na API Route:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao processar a requisição.', details: error.message }, { status: 500 });
  }
}
