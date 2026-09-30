"""
test_database.py - Pruebas unitarias para validar la restricción de correos únicos en SQLite.
"""

import os
import tempfile
import sqlite3
import unittest
from database import TodoMiGobDB

class TestDatabaseUniqueEmail(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, "test_todomigobgt.db")
        self.db = TodoMiGobDB(self.db_path)

    def tearDown(self):
        import gc
        gc.collect()
        try:
            self.temp_dir.cleanup()
        except Exception:
            pass

    def test_sqlite_schema_has_unique_index(self):
        """Verifica que el índice idx_users_email existe y tiene restricción de unicidad (unique=1)."""
        with self.db.get_connection() as conn:
            indexes = conn.execute("PRAGMA index_list(users);").fetchall()
            idx_map = {row["name"]: row["unique"] for row in indexes}
            self.assertIn("idx_users_email", idx_map)
            self.assertEqual(idx_map["idx_users_email"], 1, "El índice idx_users_email debe ser UNIQUE (1).")

    def test_direct_sql_insert_rejects_duplicate_email(self):
        """Verifica que el motor SQLite arroje sqlite3.IntegrityError ante correos duplicados."""
        with self.db.get_connection() as conn:
            conn.execute(
                "INSERT INTO users (name, email, is_active, created_at, updated_at) VALUES (?, ?, 1, ?, ?);",
                ("Usuario 1", "correo@ejemplo.gt", "2026-09-11T00:00:00Z", "2026-09-11T00:00:00Z")
            )
            conn.commit()

            with self.assertRaises(sqlite3.IntegrityError):
                conn.execute(
                    "INSERT INTO users (name, email, is_active, created_at, updated_at) VALUES (?, ?, 1, ?, ?);",
                    ("Usuario 2", "correo@ejemplo.gt", "2026-09-11T00:00:00Z", "2026-09-11T00:00:00Z")
                )
                conn.commit()

    def test_direct_sql_insert_rejects_case_insensitive_duplicate(self):
        """Verifica que no se permitan correos duplicados incluso variando mayúsculas/minúsculas (COLLATE NOCASE)."""
        with self.db.get_connection() as conn:
            conn.execute(
                "INSERT INTO users (name, email, is_active, created_at, updated_at) VALUES (?, ?, 1, ?, ?);",
                ("Usuario 1", "ciudadano@gob.gt", "2026-09-11T00:00:00Z", "2026-09-11T00:00:00Z")
            )
            conn.commit()

            with self.assertRaises(sqlite3.IntegrityError):
                conn.execute(
                    "INSERT INTO users (name, email, is_active, created_at, updated_at) VALUES (?, ?, 1, ?, ?);",
                    ("Usuario 2", "CIUDADANO@GOB.GT", "2026-09-11T00:00:00Z", "2026-09-11T00:00:00Z")
                )
                conn.commit()

    def test_register_user_rejects_duplicate_email_by_default(self):
        """Verifica que el método register_user lance ValueError al intentar registrar un correo repetido."""
        self.db.register_user("Ana Pérez", "ana@salud.gob.gt", ["health_wellbeing"])

        with self.assertRaises(ValueError) as ctx:
            self.db.register_user("Otra Ana", "ana@salud.gob.gt", ["education_scholarships"])

        self.assertIn("ya se encuentra registrado", str(ctx.exception))

        # Verificar que solo exista un usuario en la base de datos
        users = self.db.list_all_users()
        self.assertEqual(len(users), 1)
        self.assertEqual(users[0]["name"], "Ana Pérez")

    def test_register_user_allows_explicit_update(self):
        """Verifica que cuando allow_update=True se actualicen las preferencias sin duplicar filas."""
        user1 = self.db.register_user("Pedro", "pedro@gob.gt", ["health_wellbeing"])
        user2 = self.db.register_user("Pedro Actualizado", "pedro@gob.gt", ["education_scholarships"], allow_update=True)

        self.assertEqual(user1["id"], user2["id"])
        self.assertEqual(user2["name"], "Pedro Actualizado")

        users = self.db.list_all_users()
        self.assertEqual(len(users), 1)

if __name__ == "__main__":
    unittest.main()
