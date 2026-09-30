/**
 * Cliente de Conexión a la Base de Datos y API de TODOMIGOBGT
 * 
 * Conecta el frontend directamente con la base de datos (SQLite / PostgreSQL / Raspberry Pi / API REST).
 * Los endpoints y la URL del servidor son completamente configurables mediante:
 * 1. Variable de entorno Vite/Astro: import.meta.env.PUBLIC_API_URL
 * 2. Inyección en ventana de navegador: window.PUBLIC_API_URL
 * 3. Fallback predeterminado: http://localhost:8080 (o relativo /api)
 */

export interface DbUser {
  id?: number;
  name: string;
  email: string;
  is_active?: number | boolean;
  created_at?: string;
  updated_at?: string;
  preferences?: Array<{ id: string; name: string } | string>;
}

export interface DbCategory {
  id: string;
  name: string;
  description?: string;
}

export interface DbHealthStatus {
  status: string;
  service?: string;
  db?: string;
  timestamp?: string;
}

export interface DbNotificationLog {
  id: number;
  user_id: number;
  user_name: string;
  email: string;
  news_id: string;
  category_id: string;
  category_name?: string;
  status: 'SENT' | 'FAILED';
  sent_at: string;
  error_message?: string | null;
}

export interface SendEmailPayload {
  to: string;
}

export interface DispatchNewsPayload {
  id: string;
  categoryId: string;
  source: string;
  originalUrl: string;
  urgent?: boolean;
  content: {
    es: {
      title: string;
      summary: string;
      citizenAction: string;
    };
    quc?: {
      title?: string;
      summary?: string;
      citizenAction?: string;
    };
  };
}

/**
 * URL base predeterminada para desarrollo y despliegue (Tailscale Funnel / Nodo Raspberry Pi)
 */
export const DEFAULT_API_BASE_URL = 'https://trebol4devop.tail41b60f.ts.net';
export const TAILSCALE_DIRECT_API_URL = 'http://100.101.158.66:8081';

/**
 * Obtiene la URL base configurada para la base de datos y la API.
 * Prioridad:
 * 1. window.PUBLIC_API_URL (configurable en caliente desde el navegador o scripts)
 * 2. import.meta.env.PUBLIC_API_URL (definida en .env)
 * 3. Fallback al servidor local predeterminado
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && (window as any).PUBLIC_API_URL) {
    return (window as any).PUBLIC_API_URL.replace(/\/+$/, '');
  }

  const envUrl = import.meta.env.PUBLIC_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  return DEFAULT_API_BASE_URL;
}

/**
 * Permite cambiar dinámicamente la URL del backend/DB en tiempo de ejecución
 */
export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    (window as any).PUBLIC_API_URL = url.replace(/\/+$/, '');
  }
}

/**
 * Función auxiliar para realizar peticiones HTTP tipadas a los endpoints de la DB
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${path}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    });
  } catch (fetchErr) {
    // Si la URL principal de Funnel falla (ej. pendiente de aprobación), intentar fallback directo por Tailscale IP
    if (baseUrl !== TAILSCALE_DIRECT_API_URL) {
      try {
        const fallbackUrl = `${TAILSCALE_DIRECT_API_URL}${path}`;
        response = await fetch(fallbackUrl, {
          ...options,
          headers: {
            ...defaultHeaders,
            ...(options.headers || {}),
          },
        });
      } catch {
        throw fetchErr;
      }
    } else {
      throw fetchErr;
    }
  }

  if (!response.ok) {
    let errorMsg = `Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.error) {
        errorMsg = errJson.error;
      }
    } catch {
      // Usar statusText si no es json
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

/* =========================================================================
 * MÉTODOS DE ACCESO DIRECTO A LA BASE DE DATOS Y ENDPOINTS
 * ========================================================================= */

/**
 * GET /api/health
 * Verifica el estado del servidor y la conexión a la base de datos
 */
export async function checkDatabaseHealth(): Promise<DbHealthStatus> {
  return apiRequest<DbHealthStatus>('/api/health', {
    method: 'GET',
    cache: 'no-cache',
  });
}

/**
 * GET /api/categories
 * Obtiene la lista oficial de categorías desde la base de datos
 */
export async function fetchCategoriesFromDatabase(): Promise<DbCategory[]> {
  return apiRequest<DbCategory[]>('/api/categories', {
    method: 'GET',
    cache: 'no-cache',
  });
}

/**
 * POST /api/users
 * Guarda o actualiza un ciudadano con su nombre, correo y preferencias en la base de datos
 */
export async function saveUserToDatabase(data: {
  name: string;
  email: string;
  preferences: string[];
}): Promise<DbUser> {
  return apiRequest<DbUser>('/api/users', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      preferences: data.preferences,
    }),
  });
}

/**
 * GET /api/users
 * Lista todos los usuarios registrados y sus preferencias directamente de la base de datos
 */
export async function fetchUsersFromDatabase(): Promise<DbUser[]> {
  return apiRequest<DbUser[]>('/api/users', {
    method: 'GET',
    cache: 'no-cache',
  });
}

/**
 * POST /api/news/dispatch
 * Despacha notificaciones de nuevas noticias a los usuarios suscritos según categoría
 */
export async function dispatchNewsNotification(
  news: DispatchNewsPayload | DispatchNewsPayload[]
): Promise<{ success: boolean; dispatched_items?: any }> {
  return apiRequest<{ success: boolean; dispatched_items?: any }>('/api/news/dispatch', {
    method: 'POST',
    body: JSON.stringify({ news }),
  });
}

/**
 * POST /api/test-email
 * Prueba el envío de correo SMTP a través del servidor
 */
export async function sendTestEmail(
  to: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  return apiRequest<{ success: boolean; message?: string; error?: string }>('/api/test-email', {
    method: 'POST',
    body: JSON.stringify({ to: to.trim().toLowerCase() }),
  });
}

/**
 * GET /api/logs
 * Consulta el historial de auditoría de notificaciones enviadas
 */
export async function fetchNotificationLogs(): Promise<DbNotificationLog[]> {
  return apiRequest<DbNotificationLog[]>('/api/logs', {
    method: 'GET',
    cache: 'no-cache',
  });
}
