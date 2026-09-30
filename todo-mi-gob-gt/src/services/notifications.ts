/**
 * Servicio de Notificaciones y Sincronización con Base de Datos
 * 
 * Gestiona la suscripción de ciudadanos a alertas de noticias según sus categorías de interés.
 * Conecta directamente con la base de datos a través de los endpoints de la API (/api/users),
 * con tolerancia a fallos y almacenamiento local offline sincronizable.
 */

import {
  saveUserToDatabase,
  checkDatabaseHealth,
  getApiBaseUrl,
  type DbUser,
} from './api';

export interface NotificationSubscription {
  name: string;
  email: string;
  categories: string[];
  frequency: 'instant' | 'weekly';
  active: boolean;
  createdAt: string;
  updatedAt: string;
  syncedWithDb?: boolean;
}

export interface SubscribePayload {
  name?: string;
  email: string;
  categories: string[];
  frequency?: 'instant' | 'weekly';
}

export interface SubscriptionResult {
  success: boolean;
  data?: NotificationSubscription;
  syncedWithDb?: boolean;
  error?: string;
}

export const NOTIFICATION_STORAGE_KEY = 'todomigob_notification_subscription';

/**
 * Valida el formato de correo electrónico
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Verifica si el servidor de base de datos está alcanzable
 */
export async function isDatabaseConnected(): Promise<boolean> {
  try {
    const health = await checkDatabaseHealth();
    return health.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Obtiene la suscripción actual del usuario desde almacenamiento local
 */
export function getNotificationSubscription(): NotificationSubscription | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.email || !parsed.active) return null;
    return parsed as NotificationSubscription;
  } catch (err) {
    console.error('Error al leer suscripción de notificaciones:', err);
    return null;
  }
}

/**
 * Guarda o actualiza la suscripción conectándose directamente a la base de datos (/api/users)
 * con fallback seguro en almacenamiento local en caso de estar offline o URL en configuración.
 */
export async function saveNotificationSubscription(
  payload: SubscribePayload
): Promise<SubscriptionResult> {
  const trimmedEmail = (payload.email || '').trim().toLowerCase();
  const userName = (payload.name || '').trim() || trimmedEmail.split('@')[0] || 'Ciudadano';

  // Validación de correo
  if (!isValidEmail(trimmedEmail)) {
    return {
      success: false,
      error: 'Correo electrónico inválido',
    };
  }

  // Validación de categorías
  if (!payload.categories || !Array.isArray(payload.categories) || payload.categories.length === 0) {
    return {
      success: false,
      error: 'Debes seleccionar al menos una categoría',
    };
  }

  const now = new Date().toISOString();
  const existing = getNotificationSubscription();
  let syncedWithDb = false;
  let dbError: string | undefined;

  // 1. Intentar registrar / actualizar directamente en la Base de Datos
  try {
    const dbUser: DbUser = await saveUserToDatabase({
      name: userName,
      email: trimmedEmail,
      preferences: payload.categories,
    });
    if (dbUser && dbUser.email) {
      syncedWithDb = true;
    }
  } catch (err: any) {
    console.warn(`[TODOMIGOBGT DB] No se pudo sincronizar inmediatamente con la BD (${getApiBaseUrl()}):`, err.message);
    dbError = err.message;
  }

  // 2. Persistir localmente en el cliente para disponibilidad instantánea
  const subscription: NotificationSubscription = {
    name: userName,
    email: trimmedEmail,
    categories: [...payload.categories],
    frequency: payload.frequency || 'instant',
    active: true,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    syncedWithDb,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(subscription));
      // Despachar evento para sincronizar interfaces en toda la aplicación
      window.dispatchEvent(
        new CustomEvent('todomigob:subscription-changed', {
          detail: subscription,
        })
      );
    } catch (err) {
      console.error('Error al persistir suscripción local:', err);
      return {
        success: false,
        error: 'No se pudo guardar la suscripción localmente',
      };
    }
  }

  return {
    success: true,
    data: subscription,
    syncedWithDb,
    error: dbError,
  };
}

/**
 * Cancela la suscripción actual a notificaciones
 */
export async function cancelNotificationSubscription(): Promise<{ success: boolean; error?: string }> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
      window.dispatchEvent(
        new CustomEvent('todomigob:subscription-changed', {
          detail: null,
        })
      );
    } catch (err) {
      console.error('Error al cancelar suscripción:', err);
      return { success: false, error: 'Error al cancelar la suscripción' };
    }
  }

  return { success: true };
}
