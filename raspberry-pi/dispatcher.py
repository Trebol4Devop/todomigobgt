"""
dispatcher.py - Despachador de Notificaciones de Noticias para TODOMIGOB
Cruza las nuevas noticias con las preferencias de los usuarios registrados y despacha los correos.
"""

import logging
from typing import List, Dict, Any
from database import TodoMiGobDB
from mailer import TodoMiGobMailer

logger = logging.getLogger("todomigob.dispatcher")

class NotificationDispatcher:
    def __init__(self, db: TodoMiGobDB, mailer: TodoMiGobMailer):
        self.db = db
        self.mailer = mailer

    def dispatch_news_item(self, news_item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Procesa una noticia individual y envía correos a los usuarios con la preferencia correspondiente.
        """
        news_id = news_item.get("id")
        category_id = news_item.get("categoryId")

        if not news_id or not category_id:
            raise ValueError("La noticia debe contener 'id' y 'categoryId'.")

        target_users = self.db.get_users_by_category(category_id)
        logger.info(f"Noticia '{news_id}' (Categoría: {category_id}): {len(target_users)} usuarios destinatarios encontrados.")

        results = {
            "news_id": news_id,
            "category_id": category_id,
            "total_matched_users": len(target_users),
            "sent_count": 0,
            "already_notified_count": 0,
            "failed_count": 0,
            "details": []
        }

        for user in target_users:
            user_id = user["id"]
            user_email = user["email"]
            user_name = user["name"]

            # 1. Verificar si ya fue notificado previamente
            if self.db.has_user_been_notified(user_id, news_id):
                results["already_notified_count"] += 1
                results["details"].append({
                    "user_id": user_id,
                    "email": user_email,
                    "status": "SKIPPED_ALREADY_NOTIFIED"
                })
                continue

            # 2. Intentar envío del correo
            try:
                self.mailer.send_notification(user_email, user_name, news_item)
                self.db.log_notification(user_id, news_id, category_id, "SENT")
                results["sent_count"] += 1
                results["details"].append({
                    "user_id": user_id,
                    "email": user_email,
                    "status": "SENT"
                })
                logger.info(f"Notificación enviada con éxito a {user_email}")
            except Exception as e:
                error_msg = str(e)
                self.db.log_notification(user_id, news_id, category_id, "FAILED", error_msg)
                results["failed_count"] += 1
                results["details"].append({
                    "user_id": user_id,
                    "email": user_email,
                    "status": "FAILED",
                    "error": error_msg
                })
                logger.error(f"Error al enviar notificación a {user_email}: {error_msg}")

        return results

    def dispatch_batch(self, news_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Procesa una lista completa de noticias (ejemplo: las extraídas por el pipeline).
        """
        batch_results = []
        for item in news_items:
            res = self.dispatch_news_item(item)
            batch_results.append(res)
        return batch_results
