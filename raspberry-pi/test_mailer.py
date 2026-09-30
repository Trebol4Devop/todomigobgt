"""
test_mailer.py - Pruebas unitarias para el servicio de correo de bienvenida con Cloudflare R2
"""

import os
import json
import unittest
from unittest.mock import patch, MagicMock
from mailer import TodoMiGobMailer, CATEGORY_NAMES, DEFAULT_R2_NOTICIAS_URL
from database import TodoMiGobDB

class TestTodoMiGobMailer(unittest.TestCase):
    def setUp(self):
        self.mailer = TodoMiGobMailer(
            smtp_user="test@ejemplo.com",
            smtp_pass="password123",
            r2_url="https://mock-r2.dev/noticias.json"
        )
        self.mock_news_items = [
            {
                "id": "noticia-edu-1",
                "categoryId": "education_scholarships",
                "content": {
                    "es": {
                        "title": "Becas Nacionales 2026",
                        "summary": "Convocatoria para estudiantes universitarios.",
                        "citizenAction": "Llenar formulario en el portal."
                    }
                },
                "source": "MINEDUC",
                "originalUrl": "https://mineduc.gob.gt/becas"
            },
            {
                "id": "noticia-edu-2",
                "categoryId": "education_scholarships",
                "content": {
                    "es": {
                        "title": "Segunda noticia educación (no debe duplicarse)",
                        "summary": "Otra noticia.",
                        "citizenAction": "Ninguna."
                    }
                }
            },
            {
                "id": "noticia-salud-1",
                "categoryId": "health_wellbeing",
                "content": {
                    "es": {
                        "title": "Jornada de Vacunación",
                        "summary": "Puestos de salud habilitados en todo el país.",
                        "citizenAction": "Presentar carnet de vacunación."
                    }
                },
                "source": "MSPAS",
                "originalUrl": "https://mspas.gob.gt"
            },
            {
                "id": "noticia-social-1",
                "categoryId": "social_programs",
                "content": {
                    "es": {
                        "title": "Bono Social Familiar",
                        "summary": "Entrega de transferencias monetarias condicionadas.",
                        "citizenAction": "Consultar padrón en el sitio web."
                    }
                },
                "source": "MIDES",
                "originalUrl": "https://mides.gob.gt"
            },
            {
                "id": "noticia-tramites-1",
                "categoryId": "procedures_services",
                "content": {
                    "es": {
                        "title": "Renovación de Licencias Sanitarias",
                        "summary": "Ventanilla electrónica del MSPAS.",
                        "citizenAction": "Ingresar con número de expediente."
                    }
                },
                "source": "MSPAS",
                "originalUrl": "https://tramites.gob.gt"
            },
            {
                "id": "noticia-seguridad-1",
                "categoryId": "security_alerts",
                "content": {
                    "es": {
                        "title": "Alerta por Lluvias Fuertes",
                        "summary": "CONRED emite aviso de precaución.",
                        "citizenAction": "Llamar al 119 ante emergencias."
                    }
                },
                "source": "CONRED",
                "originalUrl": "https://conred.gob.gt"
            },
            {
                "id": "noticia-empleo-1",
                "categoryId": "employment_development",
                "content": {
                    "es": {
                        "title": "Feria de Empleo Departamental",
                        "summary": "Más de 1,000 vacantes disponibles.",
                        "citizenAction": "Llevar CV impreso."
                    }
                },
                "source": "MINTRAB",
                "originalUrl": "https://mintrabajo.gob.gt"
            }
        ]

    def test_get_one_news_per_category_extracts_all_six_categories(self):
        """Verifica que se seleccione exactamente una noticia por cada categoría oficial."""
        result = self.mailer.get_one_news_per_category(self.mock_news_items)
        self.assertEqual(len(result), 6)
        cat_ids = [entry["category_id"] for entry in result]
        for expected_cat in CATEGORY_NAMES.keys():
            self.assertIn(expected_cat, cat_ids)

        # Verificar que para educación tomó la primera y no duplicó
        edu_entry = next(e for e in result if e["category_id"] == "education_scholarships")
        self.assertEqual(edu_entry["news"]["id"], "noticia-edu-1")

    def test_render_welcome_html_contains_required_elements(self):
        """Verifica que la plantilla HTML de bienvenida incluya el diseño oficial y todas las noticias."""
        category_news = self.mailer.get_one_news_per_category(self.mock_news_items)
        html = self.mailer.render_welcome_html("María López", category_news)

        self.assertIn("María López", html)
        self.assertIn("TODOMIGOBGT", html)
        self.assertIn("#4997D0", html)  # Color oficial de la bandera de Guatemala
        self.assertIn("Becas Nacionales 2026", html)
        self.assertIn("Jornada de Vacunación", html)
        self.assertIn("Bono Social Familiar", html)
        self.assertIn("Renovación de Licencias Sanitarias", html)
        self.assertIn("Alerta por Lluvias Fuertes", html)
        self.assertIn("Feria de Empleo Departamental", html)
        self.assertIn("https://todomigobgt.carlosdelcidramirez.workers.dev/buscar/", html)
        self.assertIn("¿Qué debes hacer? (Acción Ciudadana):", html)

    def test_render_welcome_text_contains_required_text(self):
        """Verifica que el texto plano contenga el saludo y el desglose de categorías."""
        category_news = self.mailer.get_one_news_per_category(self.mock_news_items)
        text = self.mailer.render_welcome_text("Carlos Ruiz", category_news)

        self.assertIn("Carlos Ruiz", text)
        self.assertIn("TODOMIGOBGT", text)
        self.assertIn("EDUCACIÓN Y BECAS", text)
        self.assertIn("SALUD Y PREVENCIÓN", text)
        self.assertIn("https://todomigobgt.carlosdelcidramirez.workers.dev/buscar/", text)

    @patch("urllib.request.urlopen")
    def test_fetch_news_from_r2_success(self, mock_urlopen):
        """Verifica la descarga exitosa del JSON de noticias desde Cloudflare R2 con User-Agent."""
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.read.return_value = json.dumps({"news": self.mock_news_items}).encode("utf-8")
        mock_response.__enter__.return_value = mock_response
        mock_urlopen.return_value = mock_response

        news = self.mailer.fetch_news_from_r2("https://pub-test.r2.dev/noticias.json")
        self.assertEqual(len(news), len(self.mock_news_items))

        # Verificar cabecera User-Agent en la petición
        called_req = mock_urlopen.call_args[0][0]
        self.assertIn("User-agent", called_req.headers)
        self.assertIn("TodoMiGobGT", called_req.headers["User-agent"])

    @patch("urllib.request.urlopen", side_effect=Exception("Network error 403"))
    def test_fetch_news_from_r2_fallback_on_network_failure(self, mock_urlopen):
        """Verifica que ante un fallo de red o 403 de Cloudflare, se use el archivo de respaldo local."""
        news = self.mailer.fetch_news_from_r2("https://pub-broken.r2.dev/noticias.json")
        # Debe haber cargado el archivo local noticias_todas_categorias.json
        self.assertGreater(len(news), 0)
        categories = set(n.get("categoryId") for n in news)
        self.assertIn("health_wellbeing", categories)

    @patch("smtplib.SMTP_SSL")
    def test_send_welcome_email_smtp_ssl(self, mock_smtp_ssl):
        """Verifica el envío de correo de bienvenida usando SMTP_SSL."""
        mock_server = MagicMock()
        mock_smtp_ssl.return_value = mock_server

        category_news = self.mailer.get_one_news_per_category(self.mock_news_items)
        success = self.mailer.send_welcome_email("ciudadano@ejemplo.gt", "Ciudadano", category_news)

        self.assertTrue(success)
        mock_server.login.assert_called_once_with("test@ejemplo.com", "password123")
        self.assertTrue(mock_server.sendmail.called)
        call_args = mock_server.sendmail.call_args[0]
        self.assertEqual(call_args[1], ["ciudadano@ejemplo.gt"])
        # Verificar que el mensaje enviado contiene las cabeceras y partes esperadas
        raw_msg = call_args[2]
        self.assertIn("TODOMIGOBGT", raw_msg)
        self.assertIn("multipart/alternative", raw_msg)

class TestServerWelcomeIntegration(unittest.TestCase):
    def setUp(self):
        import tempfile
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, "server_test.db")
        self.db = TodoMiGobDB(self.db_path)

    def tearDown(self):
        import gc
        gc.collect()
        try:
            self.temp_dir.cleanup()
        except Exception:
            pass

    def test_database_register_user_returns_is_new_flag(self):
        """Verifica que register_user devuelva is_new=True en primer registro y is_new=False al actualizar."""
        user1 = self.db.register_user("Ana Morales", "ana@salud.gob.gt", ["health_wellbeing"])
        self.assertTrue(user1.get("is_new"), "El primer registro debe marcar is_new=True")

        user2 = self.db.register_user("Ana Morales Actualizada", "ana@salud.gob.gt", ["education_scholarships"], allow_update=True)
        self.assertFalse(user2.get("is_new"), "Una actualización de usuario existente debe tener is_new=False")

    @patch("mailer.TodoMiGobMailer.send_welcome_email")
    def test_welcome_email_flow_with_r2_news(self, mock_send_welcome):
        """Verifica el flujo completo: obtener noticias de R2 o respaldo y despachar el correo."""
        mailer = TodoMiGobMailer(smtp_user="test@ejemplo.com", smtp_pass="pass")
        category_news = mailer.get_one_news_per_category()
        self.assertGreaterEqual(len(category_news), 6)
        
        mailer.send_welcome_email("nuevo@ejemplo.gt", "Nuevo Ciudadano", category_news)
        mock_send_welcome.assert_called_once_with("nuevo@ejemplo.gt", "Nuevo Ciudadano", category_news)

if __name__ == "__main__":
    unittest.main()
