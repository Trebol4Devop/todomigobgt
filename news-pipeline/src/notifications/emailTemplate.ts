import type { NewsItem } from "../domain/news.js";
import { CATEGORIES } from "../domain/categories.js";

const CATEGORY_NAMES: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((cat) => [cat.id, cat.name]),
);

export function getCategoryDisplayName(categoryId: string): string {
  return CATEGORY_NAMES[categoryId] ?? "Información Oficial";
}

export function renderNewsHtml(userName: string, news: NewsItem): string {
  const categoryName = getCategoryDisplayName(news.categoryId);
  const title = news.content.es.title;
  const summary = news.content.es.summary;
  const citizenAction = news.content.es.citizenAction;
  const originalUrl = news.originalUrl || "https://todomigobgt.gob.gt";

  const urgentBanner = news.urgent
    ? `
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">
      <p style="margin: 0; color: #991b1b; font-weight: bold; font-size: 14px;">ALERTA IMPORTANTE - INFORMACIÓN PRIORITARIA</p>
    </div>`
    : "";

  const actionSection = citizenAction
    ? `
    <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 14px 18px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 6px 0; color: #166534; font-size: 15px;">¿Qué debes hacer? (Acción Ciudadana):</h3>
      <p style="margin: 0; color: #14532d; font-size: 14px; line-height: 1.5;">${citizenAction}</p>
    </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - TODOMIGOBGT</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); max-width: 600px; width: 100%;">
          
          <!-- Borde superior: Bandera de Guatemala (Azul - Blanco - Azul) -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 8px;">
                <tr>
                  <td width="33.3%" style="background-color: #4997D0;"></td>
                  <td width="33.3%" style="background-color: #FFFFFF;"></td>
                  <td width="33.3%" style="background-color: #4997D0;"></td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Encabezado Oficial -->
          <tr>
            <td style="padding: 24px 30px; background-color: #ffffff; border-bottom: 1px solid #e5e7eb; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; color: #0f172a; letter-spacing: 0.5px;">TODOMIGOBGT</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 500;">
                Portal de Noticias y Servicios Oficiales de Guatemala
              </p>
            </td>
          </tr>

          <!-- Cuerpo de la Notificación -->
          <tr>
            <td style="padding: 32px 30px;">
              ${urgentBanner}

              <!-- Distintivo de categoría -->
              <div style="display: inline-block; padding: 4px 12px; background-color: #e0f2fe; color: #0369a1; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 16px;">
                ${categoryName}
              </div>

              <p style="margin: 0 0 16px 0; font-size: 15px; color: #475569;">
                Estimado/a <strong>${userName}</strong>,
              </p>
              
              <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #0f172a; line-height: 1.4;">
                ${title}
              </h2>

              <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.6;">
                ${summary}
              </p>

              ${actionSection}

              <!-- Botón de acción -->
              <div style="text-align: center; margin: 32px 0 16px 0;">
                <a href="https://todomigobgt.carlosdelcidramirez.workers.dev/buscar/" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #4997D0; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; box-shadow: 0 2px 4px rgba(73, 151, 208, 0.3);">
                  Ver Notificación Completa
                </a>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 13px; color: #94a3b8; text-align: center;">
                Fuente: <a href="${originalUrl}" style="color: #4997D0; text-decoration: underline;">${news.source}</a>
              </p>
            </td>
          </tr>

          <!-- Pie de página Institucional -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Recibiste esta notificación porque estás suscrito a la categoría <strong>${categoryName}</strong> en TODOMIGOBGT.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderNewsText(userName: string, news: NewsItem): string {
  const categoryName = getCategoryDisplayName(news.categoryId);
  const title = news.content.es.title;
  const summary = news.content.es.summary;
  const action = news.content.es.citizenAction;
  const url = "https://todomigobgt.carlosdelcidramirez.workers.dev/buscar/";

  let text = `TODOMIGOBGT - ${categoryName.toUpperCase()}\n`;
  text += `${"=".repeat(40)}\n\n`;
  text += `Estimado/a ${userName},\n\n`;
  text += `NOTICIA: ${title}\n\n`;
  text += `RESUMEN:\n${summary}\n\n`;
  if (action) {
    text += `¿QUÉ DEBES HACER?:\n${action}\n\n`;
  }
  text += `Enlace oficial: ${url}\n\n`;
  text += `---\nTODOMIGOBGT Alertas Ciudadanas\n`;
  return text;
}

export interface WelcomeCategoryNewsItem {
  categoryId: string;
  categoryName?: string;
  news: NewsItem;
}

export function renderWelcomeHtml(
  userName: string,
  categoryNewsList: readonly WelcomeCategoryNewsItem[],
): string {
  const cards = categoryNewsList.map((entry) => {
    const catName = entry.categoryName ?? getCategoryDisplayName(entry.categoryId);
    const title = entry.news.content.es.title;
    const summary = entry.news.content.es.summary;
    const action = entry.news.content.es.citizenAction;
    const originalUrl = entry.news.originalUrl || "https://todomigobgt.carlosdelcidramirez.workers.dev/buscar/";
    const source = entry.news.source || "Gobierno de Guatemala";

    const actionHtml = action
      ? `
        <div style="background-color: #f0fdf4; border-left: 3px solid #22c55e; padding: 10px 14px; margin: 12px 0; border-radius: 4px;">
          <p style="margin: 0; color: #166534; font-size: 13px; line-height: 1.4;">
            <strong>¿Qué debes hacer? (Acción Ciudadana):</strong> ${action}
          </p>
        </div>`
      : "";

    return `
      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
        <div style="display: inline-block; padding: 4px 12px; background-color: #e0f2fe; color: #0369a1; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px;">
          ${catName}
        </div>
        <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #0f172a; line-height: 1.4;">
          <a href="${originalUrl}" target="_blank" style="color: #0f172a; text-decoration: none;">${title}</a>
        </h3>
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #334155; line-height: 1.6;">
          ${summary}
        </p>
        ${actionHtml}
        <div style="font-size: 12px; color: #94a3b8; margin-top: 10px;">
          Fuente: <a href="${originalUrl}" target="_blank" style="color: #4997D0; text-decoration: underline;">${source}</a>
        </div>
      </div>`;
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Bienvenido/a a TODOMIGOBGT! - Resumen de Noticias</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); max-width: 640px; width: 100%;">
          
          <!-- Borde superior: Bandera de Guatemala (Azul - Blanco - Azul) -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="height: 8px;">
                <tr>
                  <td width="33.3%" style="background-color: #4997D0;"></td>
                  <td width="33.4%" style="background-color: #FFFFFF;"></td>
                  <td width="33.3%" style="background-color: #4997D0;"></td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Encabezado Oficial -->
          <tr>
            <td style="padding: 24px 30px; background-color: #ffffff; border-bottom: 1px solid #e5e7eb; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; color: #0f172a; letter-spacing: 0.5px;">TODOMIGOBGT</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 500;">
                Portal de Noticias y Servicios Oficiales de Guatemala
              </p>
            </td>
          </tr>

          <!-- Contenido Principal -->
          <tr>
            <td style="padding: 32px 30px;">
              <!-- Banner de Bienvenida -->
              <div style="background-color: #f0f9ff; border-left: 4px solid #4997D0; padding: 18px 20px; margin-bottom: 24px; border-radius: 4px;">
                <h2 style="margin: 0 0 8px 0; color: #0369a1; font-size: 20px;">
                  ¡Bienvenido/a a TODOMIGOBGT, ${userName}!
                </h2>
                <p style="margin: 0; color: #1e293b; font-size: 14px; line-height: 1.5;">
                  Tu suscripción al sistema de notificaciones ciudadanas ha sido completada exitosamente. A partir de ahora recibirás alertas inmediatas cada vez que se publique información oficial correspondiente a tus preferencias.
                </p>
              </div>

              <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.6;">
                Para darte la bienvenida, hemos consultado las publicaciones más recientes del Estado y preparamos para ti <strong>una noticia destacada de cada categoría</strong> disponible en este momento:
              </p>

              <!-- Tarjetas de Noticias por Categoría -->
              <div style="margin: 24px 0;">
                ${cards.join("\n")}
              </div>

              <!-- Botón de acción al portal -->
              <div style="text-align: center; margin: 32px 0 16px 0;">
                <a href="https://todomigobgt.carlosdelcidramirez.workers.dev/buscar/" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #4997D0; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; box-shadow: 0 2px 4px rgba(73, 151, 208, 0.3);">
                  Explorar Todas las Noticias en el Portal
                </a>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 12px; color: #94a3b8; text-align: center;">
                Noticias extraídas y sincronizadas directamente desde Cloudflare R2.
              </p>
            </td>
          </tr>

          <!-- Pie de página Institucional -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Recibiste este correo de bienvenida porque te registraste en el sistema de alertas cívicas de TODOMIGOBGT.
              </p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">
                © 2026 TODOMIGOBGT · Trebol4Devop+
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderWelcomeText(
  userName: string,
  categoryNewsList: readonly WelcomeCategoryNewsItem[],
): string {
  const url = "https://todomigobgt.carlosdelcidramirez.workers.dev/buscar/";
  let text = "TODOMIGOBGT - ¡BIENVENIDO/A AL SISTEMA DE ALERTAS CIUDADANAS!\n";
  text += `${"=".repeat(60)}\n\n`;
  text += `Estimado/a ${userName},\n\n`;
  text += "Tu registro ha sido completado exitosamente. A partir de ahora recibirás alertas\n";
  text += "inmediatas en tu correo sobre las categorías que seleccionaste.\n\n";
  text += "A continuación te compartimos una noticia destacada de cada categoría oficial:\n\n";
  text += `${"-".repeat(60)}\n\n`;

  for (const entry of categoryNewsList) {
    const catName = entry.categoryName ?? getCategoryDisplayName(entry.categoryId);
    const title = entry.news.content.es.title;
    const summary = entry.news.content.es.summary;
    const action = entry.news.content.es.citizenAction;
    const originalUrl = entry.news.originalUrl || url;
    const source = entry.news.source || "Gobierno de Guatemala";

    text += `CATEGORÍA: ${catName.toUpperCase()}\n`;
    text += `TÍTULO: ${title}\n`;
    text += `RESUMEN: ${summary}\n`;
    if (action) {
      text += `¿QUÉ DEBES HACER?: ${action}\n`;
    }
    text += `FUENTE: ${source} (${originalUrl})\n\n`;
    text += `${"-".repeat(60)}\n\n`;
  }

  text += `Explora el portal completo en: ${url}\n\n`;
  text += "---\nTODOMIGOBGT · Alertas Ciudadanas\n";
  return text;
}

