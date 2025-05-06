import axios from 'axios';

// Tipos para as requisições
interface Address {
  postal_code: string;
  address?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state_abbr?: string;
  country_id?: string;
}

interface PackageDimensions {
  weight: number; // em kg
  width: number;  // em cm
  height: number; // em cm
  length: number; // em cm
}

interface ShippingOptions {
  insurance_value?: number;
  receipt?: boolean;
  own_hand?: boolean;
  collect?: boolean;
  non_commercial?: boolean;
}

interface ShippingCalculatePayload {
  from: Address;
  to: Address;
  package: PackageDimensions;
  services?: string; // IDs dos serviços separados por vírgula (ex: "1,2")
  options?: ShippingOptions;
}

interface ShippingResponse {
  id: number;
  name: string;
  price: string;
  custom_price?: string;
  discount?: string;
  currency: string;
  delivery_time?: number;
  delivery_range?: {
    min: number;
    max: number;
  };
  custom_delivery_time?: number;
  custom_delivery_range?: {
    min: number;
    max: number;
  };
  packages?: any[];
  additional_services?: any;
  company?: {
    id: number;
    name: string;
    picture: string;
  };
  error?: string;
}

// Configuração da API
const API_URL = 'https://sandbox.melhorenvio.com.br/api/v2'; // URL do sandbox
const TOKEN = process.env.MELHOR_ENVIO_TOKEN;
const CLIENT_ID = process.env.MELHOR_ENVIO_CLIENT_ID;
const CLIENT_SECRET = process.env.MELHOR_ENVIO_CLIENT_SECRET;

// Função para formatar o token de acesso (adicionar prefixo "Bearer " se necessário)
function formatToken(token: string | undefined): string {
  if (!token) return '';
  
  // Se o token já começa com "Bearer ", retorna como está
  if (token.startsWith('Bearer ')) {
    return token;
  }
  
  // Caso contrário, adiciona o prefixo "Bearer "
  return `Bearer ${token}`;
}

// Log para depuração (não inclui o token completo por segurança)
console.log('Inicializando cliente API do Melhor Envio');
console.log('Client ID usado:', CLIENT_ID);
console.log('Token (primeiros 10 caracteres):', 
  TOKEN ? TOKEN.substring(0, 10) + '...' : 'não definido');

// Criar instância do axios com configurações padrão
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': formatToken(TOKEN),
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'MiBrasil (contato@mibrasil.com.br)'
  },
  timeout: 5000 // 5 segundos
});

// Função para calcular frete
async function calculateShipment(payload: ShippingCalculatePayload): Promise<ShippingResponse[]> {
  try {
    const response = await apiClient.post('/me/shipment/calculate', payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao calcular frete:', error);
    throw error;
  }
}

// Função para obter serviços de envio disponíveis
async function getShipmentServices(): Promise<any> {
  try {
    const response = await apiClient.get('/me/shipment/services');
    return response.data;
  } catch (error) {
    console.error('Erro ao obter serviços de envio:', error);
    throw error;
  }
}

// Exportar funções e tipos
export {
  calculateShipment,
  getShipmentServices
};

// Exportar tipos
export type {
  ShippingCalculatePayload,
  ShippingResponse,
  Address,
  PackageDimensions,
  ShippingOptions
};

// Para manter compatibilidade com código existente, exportamos um objeto com as mesmas propriedades
export default {
  shipment: {
    calculate: calculateShipment,
    getServices: getShipmentServices
  }
};
