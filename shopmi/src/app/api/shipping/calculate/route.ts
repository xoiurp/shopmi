import { NextResponse } from 'next/server';
import { 
  calculateShipment, 
  type ShippingCalculatePayload, 
  // type Address, // Removido pois não é usado
  type PackageDimensions 
} from '@/lib/melhorenvio';
// import melhorEnvio, // Removido pois não é usado

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

    let shippingOptions: unknown; // Alterado para unknown
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
    } catch (sdkError: unknown) { // Alterado para unknown
      console.error('Erro direto da API Melhor Envio:', sdkError);
      
      let message = 'Erro desconhecido ao comunicar com Melhor Envio';
      let status: number | undefined;
      let responseData: any;
      let stack: string | undefined;

      if (sdkError instanceof Error) {
        message = sdkError.message;
        stack = sdkError.stack;
        if (typeof (sdkError as any).response?.status === 'number') {
          status = (sdkError as any).response.status;
        }
        responseData = (sdkError as any).response?.data;
      }
      
      // Extrair mais detalhes do erro para depuração
      const errorDetailsPayload = { // Alterado para const
        message,
        stack,
        status,
        statusText: status ? (sdkError as any).response?.statusText : undefined, // Apenas se status existir
        data: responseData
      };
      
      console.error('Detalhes do erro:', JSON.stringify(errorDetailsPayload, null, 2));
      
      // Se for erro 401 (Unauthorized), adicionar informações sobre o token
      if (status === 401) {
        console.error('Erro de autenticação (401). Verifique se o token está correto e não expirou.');
        console.error('Client ID usado:', process.env.MELHOR_ENVIO_CLIENT_ID);
        // Não logar o token completo por segurança
        console.error('Token (primeiros 10 caracteres):', 
          process.env.MELHOR_ENVIO_TOKEN ? process.env.MELHOR_ENVIO_TOKEN.substring(0, 10) + '...' : 'não definido');
      }
      
      // Retorna o erro para o cliente para depuração
      return NextResponse.json({
        error: 'Erro na chamada da API Melhor Envio.',
        details: errorDetailsPayload
      }, { status: status || 502 }); // 502 Bad Gateway pode ser mais apropriado
    }

    // 4. Verificar a resposta do Melhor Envio (após a chamada bem-sucedida)
    let hasError = false;
    let responseErrorDetails = null; // Renomeado para evitar conflito

    if (!shippingOptions) {
      hasError = true;
      responseErrorDetails = 'Resposta inválida da API Melhor Envio.';
      console.error(responseErrorDetails);
    } else if (typeof shippingOptions === 'object' && shippingOptions !== null && 'error' in shippingOptions && !Array.isArray(shippingOptions)) {
      // Caso a resposta seja um objeto de erro diretamente
      hasError = true;
      responseErrorDetails = (shippingOptions as { error: string }).error;
      console.error('Erro retornado pela API Melhor Envio (objeto):', responseErrorDetails);
    } else if (Array.isArray(shippingOptions)) {
      if (shippingOptions.length === 0) {
        // Resposta é um array vazio - pode não ser um erro, apenas sem opções
        console.warn('Nenhuma opção de frete retornada pela API Melhor Envio (array vazio).');
        // Não definimos como erro, apenas retornaremos array vazio
      } else if (shippingOptions.every((opt: any) => opt && typeof opt === 'object' && 'error' in opt)) { // TODO: Define a more specific type for opt
        // Só consideramos erro se TODAS as opções tiverem erro
        hasError = true;
        responseErrorDetails = 'Nenhuma opção de frete disponível para este CEP.';
        console.error('Todos os serviços retornaram erro:', responseErrorDetails);
      } else if (shippingOptions.some((opt: any) => opt && typeof opt === 'object' && 'error' in opt)) { // TODO: Define a more specific type for opt
        // Se apenas algumas opções tiverem erro, logamos mas não consideramos erro geral
        const errorOption = shippingOptions.find((opt: any) => opt && typeof opt === 'object' && 'error' in opt); // TODO: Define a more specific type for opt
        console.warn('Alguns serviços não estão disponíveis:', (errorOption as { error?: string })?.error);
      }
    }

    // Se houve algum erro detectado nos passos acima (todos os serviços indisponíveis)
    if (hasError) {
      return NextResponse.json({ error: 'Erro ao calcular frete com Melhor Envio.', details: responseErrorDetails }, { status: 500 });
    }

    // 5. Retornar as opções de frete calculadas (se não houve erro)
    // Filtra apenas opções válidas (sem erro e com preço)
    const validOptions = Array.isArray(shippingOptions)
      ? shippingOptions.filter((option: any) => // TODO: Define a more specific type for option
          option && 
          typeof option === 'object' && 
          !('error' in option) && 
          'price' in option
        ) 
      : [];

    console.log('Opções de frete válidas:', JSON.stringify(validOptions, null, 2));
    return NextResponse.json(validOptions);

  } catch (error: unknown) { // Alterado para unknown
    // Este catch agora pega erros *antes* da chamada do SDK ou erros inesperados gerais
    console.error('Erro interno GERAL na API Route:', error);
    const message = error instanceof Error ? error.message : 'Erro interno desconhecido';
    return NextResponse.json({ error: 'Erro interno do servidor ao processar a requisição.', details: message }, { status: 500 });
  }
}
