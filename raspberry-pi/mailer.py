"""
mailer.py - Servicio de Notificaciones por Correo Electrónico para TODOMIGOBGT
Soporta servidor SMTP Gmail con contraseña de aplicación oficial ('todomigobgt').
Diseño oficial con la bandera de Guatemala (#4997D0), responsive para móviles y fallback texto plano.
"""

import os
import smtplib
import json
import logging
import urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Optional, List

logger = logging.getLogger("todomigobgt.mailer")

# Configuración por defecto solicitada por el usuario
DEFAULT_SMTP_HOST = "smtp.gmail.com"
DEFAULT_SMTP_PORT = 465
DEFAULT_SMTP_PASS = "lykc jsej osgf ezee".replace(" ", "")
DEFAULT_APP_NAME = "todomigobgt"

# Endpoint oficial de noticias publicado en Cloudflare R2 por el news-pipeline
DEFAULT_R2_NOTICIAS_URL = "https://pub-b246f9594b0f4cb5960b8f6ec9f1ba2b.r2.dev/noticias.json"

CATEGORY_NAMES = {
    "education_scholarships": "Educación y Becas",
    "health_wellbeing": "Salud y Prevención",
    "social_programs": "Apoyo Social",
    "procedures_services": "Trámites y Documentos",
    "security_alerts": "Alertas y Emergencias",
    "employment_development": "Empleo y Emprendimiento"
}

class TodoMiGobMailer:
    def __init__(
        self,
        smtp_host: Optional[str] = None,
        smtp_port: Optional[int] = None,
        smtp_user: Optional[str] = None,
        smtp_pass: Optional[str] = None,
        sender_name: str = "TODOMIGOBGT Alertas Ciudadanas",
        r2_url: Optional[str] = None
    ):
        self.smtp_host = smtp_host or os.getenv("SMTP_HOST", DEFAULT_SMTP_HOST)
        self.smtp_port = int(smtp_port or os.getenv("SMTP_PORT", str(DEFAULT_SMTP_PORT)))
        # El usuario puede definir SMTP_USER en el archivo .env o pasar su correo
        self.smtp_user = (smtp_user or os.getenv("SMTP_USER", "")).strip()
        raw_pass = smtp_pass or os.getenv("SMTP_PASS", DEFAULT_SMTP_PASS)
        self.smtp_pass = raw_pass.replace(" ", "").strip()
        self.sender_name = sender_name
        self.r2_url = r2_url or os.getenv("R2_NOTICIAS_URL", os.getenv("CLOUDFLARE_R2_URL", DEFAULT_R2_NOTICIAS_URL))

    def render_news_html(self, user_name: str, news: Dict[str, Any], category_name: str) -> str:
        """
        Genera el correo HTML con la identidad gráfica oficial de TODOMIGOBGT:
        - Banderín de Guatemala (#4997D0 / #FFFFFF / #4997D0)
        - Encabezado oficial del gobierno
        - Título, resumen y Acción Ciudadana
        - Botón de llamado a la acción al portal oficial
        """
        content_es = news.get("content", {}).get("es", {})
        title = content_es.get("title", news.get("title", "Nueva actualización importante"))
        summary = content_es.get("summary", news.get("summary", "Se ha publicado información de tu interés en el portal."))
        citizen_action = content_es.get("citizenAction", news.get("citizenAction", ""))
        original_url = news.get("originalUrl", "https://todomigobgt.gob.gt")
        is_urgent = news.get("urgent", False)

        urgent_banner = ""
        if is_urgent:
            urgent_banner = """
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">
                <p style="margin: 0; color: #991b1b; font-weight: bold; font-size: 14px;">ALERTA IMPORTANTE - INFORMACIÓN PRIORITARIA</p>
            </div>
            """

        action_section = ""
        if citizen_action:
            action_section = f"""
            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 14px 18px; margin: 20px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 6px 0; color: #166534; font-size: 15px;">¿Qué debes hacer? (Acción Ciudadana):</h3>
                <p style="margin: 0; color: #14532d; font-size: 14px; line-height: 1.5;">{citizen_action}</p>
            </div>
            """

        return f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - TODOMIGOBGT</title>
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
                            {urgent_banner}

                            <!-- Distintivo de categoría -->
                            <div style="display: inline-block; padding: 4px 12px; background-color: #e0f2fe; color: #0369a1; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 16px;">
                                {category_name}
                            </div>

                            <p style="margin: 0 0 16px 0; font-size: 15px; color: #475569;">
                                Estimado/a <strong>{user_name}</strong>,
                            </p>
                            
                            <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #0f172a; line-height: 1.4;">
                                {title}
                            </h2>

                            <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155; line-height: 1.6;">
                                {summary}
                            </p>

                            {action_section}

                            <!-- Botón de acción -->
                            <div style="text-align: center; margin: 32px 0 16px 0;">
                                <a href="https://todomigobgt.carlosdelcidramirez.workers.dev/buscar/" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #4997D0; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; box-shadow: 0 2px 4px rgba(73, 151, 208, 0.3);">
                                    Ver Notificación Completa
                                </a>
                            </div>

                            <p style="margin: 24px 0 0 0; font-size: 13px; color: #94a3b8; text-align: center;">
                                Fuente original: <a href="{original_url}" style="color: #4997D0; text-decoration: underline;">{news.get('source', 'Gobierno de Guatemala')}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Pie de página Institucional -->
                    <tr>
                        <td style="padding: 20px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #64748b;">
                                Recibiste esta notificación porque estás suscrito a la categoría <strong>{category_name}</strong> en TODOMIGOBGT.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""

    def render_news_text(self, user_name: str, news: Dict[str, Any], category_name: str) -> str:
        """Versión en texto plano para clientes de correo sin soporte HTML."""
        content_es = news.get("content", {}).get("es", {})
        title = content_es.get("title", news.get("title", "Nueva noticia"))
        summary = content_es.get("summary", news.get("summary", ""))
        action = content_es.get("citizenAction", news.get("citizenAction", ""))
        url = "https://todomigobgt.carlosdelcidramirez.workers.dev/buscar/"

        text = f"TODOMIGOBGT - {category_name.upper()}\n"
        text += "=" * 40 + "\n\n"
        text += f"Estimado/a {user_name},\n\n"
        text += f"NOTICIA: {title}\n\n"
        text += f"RESUMEN:\n{summary}\n\n"
        if action:
            text += f"¿QUÉ DEBES HACER?:\n{action}\n\n"
        text += f"Más detalles en: {url}\n\n"
        text += "---\nTODOMIGOBGT Alertas Ciudadanas\n"
        return text

    def send_notification(self, to_email: str, user_name: str, news: Dict[str, Any]) -> bool:
        """
        Envía un correo de notificación individual.
        Retorna True si fue exitoso, o lanza excepción si falló.
        """
        category_id = news.get("categoryId", "procedures_services")
        category_name = CATEGORY_NAMES.get(category_id, "Información Oficial")
        content_es = news.get("content", {}).get("es", {})
        title = content_es.get("title", news.get("title", "Nueva notificación de TODOMIGOBGT"))

        subject = f"[TODOMIGOBGT] {category_name}: {title}"
        html_body = self.render_news_html(user_name, news, category_name)
        text_body = self.render_news_text(user_name, news, category_name)

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        sender_address = self.smtp_user if self.smtp_user else "notificaciones@todomigobgt.gob.gt"
        msg["From"] = f"{self.sender_name} <{sender_address}>"
        msg["To"] = to_email

        # Adjuntar ambas versiones
        msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        if not self.smtp_user:
            raise ValueError("No se ha configurado SMTP_USER (tu correo de Gmail). Por favor defínelo en el archivo .env o en la configuración.")

        # Conexión SMTP
        if self.smtp_port == 465:
            server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=15)
        else:
            server = smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=15)
            server.starttls()

        try:
            server.login(self.smtp_user, self.smtp_pass)
            server.sendmail(sender_address, [to_email], msg.as_string())
            return True
        finally:
            server.quit()

    def fetch_news_from_r2(self, r2_url: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Descarga el JSON consolidado de noticias desde el bucket de Cloudflare R2
        que utiliza el news-pipeline.
        Configura cabecera User-Agent para sortear la protección anti-bot (403) de Cloudflare.
        Si la red o el bucket no responden, utiliza respaldos locales existentes.
        """
        target_url = r2_url or self.r2_url
        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; TodoMiGobGT/1.0; +https://todomigobgt.carlosdelcidramirez.workers.dev)",
            "Accept": "application/json"
        }

        try:
            req = urllib.request.Request(target_url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as response:
                if response.status == 200:
                    payload = response.read().decode("utf-8")
                    data = json.loads(payload)
                    news_items = data.get("news", data) if isinstance(data, dict) else data
                    if isinstance(news_items, list) and len(news_items) > 0:
                        logger.info(f"Se obtuvieron exitosamente {len(news_items)} noticias desde Cloudflare R2.")
                        return news_items
        except Exception as e:
            logger.warning(f"No fue posible consultar Cloudflare R2 en '{target_url}': {e}. Usando respaldo local.")

        # Respaldo local si R2 no está disponible
        fallback_paths = [
            os.path.join(os.path.dirname(__file__), "noticias_todas_categorias.json"),
            os.path.join(os.path.dirname(__file__), "..", "news-pipeline", "output", "noticias.json"),
            os.path.join(os.path.dirname(__file__), "..", "news-pipeline", "output", "noticias.preview.json")
        ]

        for path in fallback_paths:
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        news_items = data.get("news", data) if isinstance(data, dict) else data
                        if isinstance(news_items, list) and len(news_items) > 0:
                            logger.info(f"Se cargaron {len(news_items)} noticias desde archivo local: {path}")
                            return news_items
                except Exception:
                    pass

        return []

    def get_one_news_per_category(self, news_items: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        """
        Filtra y extrae exactamente una noticia por cada categoría oficial de TODOMIGOBGT.
        Si news_items es None, se consultan automáticamente desde Cloudflare R2.
        """
        if news_items is None:
            news_items = self.fetch_news_from_r2()

        chosen_by_category: Dict[str, Dict[str, Any]] = {}
        for item in news_items:
            cat_id = item.get("categoryId") or item.get("category_id")
            if cat_id and cat_id not in chosen_by_category:
                chosen_by_category[cat_id] = item

        # Si faltan categorías conocidas, verificar el archivo de respaldo con todas las categorías
        missing_cats = [c for c in CATEGORY_NAMES.keys() if c not in chosen_by_category]
        if missing_cats:
            local_fallback = os.path.join(os.path.dirname(__file__), "noticias_todas_categorias.json")
            if os.path.exists(local_fallback):
                try:
                    with open(local_fallback, "r", encoding="utf-8") as f:
                        fb_data = json.load(f)
                        fb_items = fb_data.get("news", fb_data) if isinstance(fb_data, dict) else fb_data
                        for item in fb_items:
                            c_id = item.get("categoryId") or item.get("category_id")
                            if c_id in missing_cats and c_id not in chosen_by_category:
                                chosen_by_category[c_id] = item
                except Exception:
                    pass

        # Construir lista ordenada siguiendo CATEGORY_NAMES
        result = []
        for cat_id, cat_name in CATEGORY_NAMES.items():
            if cat_id in chosen_by_category:
                result.append({
                    "category_id": cat_id,
                    "category_name": cat_name,
                    "news": chosen_by_category[cat_id]
                })

        # Si vienen categorías adicionales en el JSON no presentes en CATEGORY_NAMES
        for cat_id, item in chosen_by_category.items():
            if cat_id not in CATEGORY_NAMES:
                result.append({
                    "category_id": cat_id,
                    "category_name": cat_id.replace("_", " ").title(),
                    "news": item
                })

        return result

    def render_welcome_html(self, user_name: str, category_news_list: List[Dict[str, Any]]) -> str:
        """
        Genera el correo de bienvenida en formato HTML con la identidad oficial TODOMIGOBGT:
        - Banderín cívico de Guatemala (#4997D0 / #FFFFFF / #4997D0)
        - Mensaje personalizado de bienvenida para el ciudadano recién suscrito
        - Un bloque independiente por cada categoría con su noticia destacada, resumen y acción ciudadana
        - Botón de acceso al buscador oficial
        """
        news_cards_html = []
        for entry in category_news_list:
            cat_name = entry.get("category_name", "Información Oficial")
            news = entry.get("news", {})
            content_es = news.get("content", {}).get("es", {}) if isinstance(news.get("content"), dict) else {}
            title = content_es.get("title") or news.get("title") or "Actualización destacada"
            summary = content_es.get("summary") or news.get("summary") or "Información oficial para la ciudadanía."
            citizen_action = content_es.get("citizenAction") or news.get("citizenAction") or ""
            original_url = news.get("originalUrl") or news.get("original_url") or "https://todomigobgt.carlosdelcidramirez.workers.dev/buscar/"
            source = news.get("source") or "Gobierno de Guatemala"

            action_section = ""
            if citizen_action:
                action_section = f"""
                <div style="background-color: #f0fdf4; border-left: 3px solid #22c55e; padding: 10px 14px; margin: 12px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #166534; font-size: 13px; line-height: 1.4;">
                        <strong>¿Qué debes hacer? (Acción Ciudadana):</strong> {citizen_action}
                    </p>
                </div>
                """

            card = f"""
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                <div style="display: inline-block; padding: 4px 12px; background-color: #e0f2fe; color: #0369a1; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px;">
                    {cat_name}
                </div>
                <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #0f172a; line-height: 1.4;">
                    <a href="{original_url}" target="_blank" style="color: #0f172a; text-decoration: none;">{title}</a>
                </h3>
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #334155; line-height: 1.6;">
                    {summary}
                </p>
                {action_section}
                <div style="font-size: 12px; color: #94a3b8; margin-top: 10px;">
                    Fuente: <a href="{original_url}" target="_blank" style="color: #4997D0; text-decoration: underline;">{source}</a>
                </div>
            </div>
            """
            news_cards_html.append(card)

        cards_combined = "\n".join(news_cards_html)

        return f"""<!DOCTYPE html>
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
                                    ¡Bienvenido/a a TODOMIGOBGT, {user_name}!
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
                                {cards_combined}
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
</html>"""

    def render_welcome_text(self, user_name: str, category_news_list: List[Dict[str, Any]]) -> str:
        """Versión en texto plano para clientes de correo sin soporte HTML."""
        url = "https://todomigobgt.carlosdelcidramirez.workers.dev/buscar/"
        text = "TODOMIGOBGT - ¡BIENVENIDO/A AL SISTEMA DE ALERTAS CIUDADANAS!\n"
        text += "=" * 60 + "\n\n"
        text += f"Estimado/a {user_name},\n\n"
        text += "Tu registro ha sido completado exitosamente. A partir de ahora recibirás alertas\n"
        text += "inmediatas en tu correo sobre las categorías que seleccionaste.\n\n"
        text += "A continuación te compartimos una noticia destacada de cada categoría oficial:\n\n"
        text += "-" * 60 + "\n\n"

        for entry in category_news_list:
            cat_name = entry.get("category_name", "Información Oficial")
            news = entry.get("news", {})
            content_es = news.get("content", {}).get("es", {}) if isinstance(news.get("content"), dict) else {}
            title = content_es.get("title") or news.get("title") or "Noticia Destacada"
            summary = content_es.get("summary") or news.get("summary") or ""
            citizen_action = content_es.get("citizenAction") or news.get("citizenAction") or ""
            original_url = news.get("originalUrl") or news.get("original_url") or url
            source = news.get("source") or "Gobierno de Guatemala"

            text += f"CATEGORÍA: {cat_name.upper()}\n"
            text += f"TÍTULO: {title}\n"
            text += f"RESUMEN: {summary}\n"
            if citizen_action:
                text += f"¿QUÉ DEBES HACER?: {citizen_action}\n"
            text += f"FUENTE: {source} ({original_url})\n\n"
            text += "-" * 60 + "\n\n"

        text += f"Explora el portal completo en: {url}\n\n"
        text += "---\nTODOMIGOBGT · Alertas Ciudadanas\n"
        return text

    def send_welcome_email(
        self,
        to_email: str,
        user_name: str,
        category_news_list: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        """
        Envía un correo oficial de bienvenida que incluye una noticia de cada categoría,
        consultando automáticamente el bucket de Cloudflare R2 si no se proporcionan noticias.
        """
        if category_news_list is None:
            category_news_list = self.get_one_news_per_category()

        subject = "[TODOMIGOBGT] ¡Bienvenido/a a TODOMIGOBGT! - Noticias destacadas por categoría"
        html_body = self.render_welcome_html(user_name, category_news_list)
        text_body = self.render_welcome_text(user_name, category_news_list)

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        sender_address = self.smtp_user if self.smtp_user else "notificaciones@todomigobgt.gob.gt"
        msg["From"] = f"{self.sender_name} <{sender_address}>"
        msg["To"] = to_email

        msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        if not self.smtp_user:
            raise ValueError("No se ha configurado SMTP_USER (tu correo de Gmail). Por favor defínelo en el archivo .env o en la configuración.")

        if self.smtp_port == 465:
            server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=15)
        else:
            server = smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=15)
            server.starttls()

        try:
            server.login(self.smtp_user, self.smtp_pass)
            server.sendmail(sender_address, [to_email], msg.as_string())
            return True
        finally:
            server.quit()
