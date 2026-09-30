import { describe, expect, it, vi, beforeEach } from "vitest";
import { rm } from "node:fs/promises";
import { JsonFileUserDatabase } from "../../../src/notifications/database.js";
import { MockEmailTransport } from "../../../src/notifications/emailTransport.js";
import { NotificationDispatcher } from "../../../src/notifications/notificationDispatcher.js";
import {
  renderNewsHtml,
  renderNewsText,
  renderWelcomeHtml,
  renderWelcomeText,
} from "../../../src/notifications/emailTemplate.js";
import type { NewsItem } from "../../../src/domain/news.js";

const TEST_DB_PATH = "./output/test-notifications-db.json";

const sampleNews: NewsItem = {
  id: "test-news-health-01",
  originalUrl: "https://todomigobgt.gob.gt/noticias/salud-01",
  source: "MSPAS",
  sourceType: "news",
  categoryId: "health_wellbeing",
  tags: ["salud", "vacunas"],
  publishedAt: "2026-09-10T12:00:00Z",
  extractedAt: "2026-09-10T12:30:00Z",
  urgent: true,
  content: {
    es: {
      title: "Jornada Nacional de Vacunación",
      summary: "Centros de salud abiertos este fin de semana.",
      citizenAction: "Presentarse con DPI y carnet infantil.",
    },
    quc: {
      title: "K'o kunab'al",
      summary: "Ja' k'o kunab'al pa le centros",
      citizenAction: "Chak'ama' b'i la wuj",
    },
  },
};

const sampleNewsEducation: NewsItem = {
  id: "test-news-edu-01",
  originalUrl: "https://todomigobgt.gob.gt/noticias/becas-01",
  source: "MINEDUC",
  sourceType: "news",
  categoryId: "education_scholarships",
  tags: ["educación", "becas"],
  publishedAt: "2026-09-10T14:00:00Z",
  extractedAt: "2026-09-10T14:30:00Z",
  urgent: false,
  content: {
    es: {
      title: "Convocatoria de Becas Universitarias",
      summary: "Se abren 1,000 becas para estudios superiores.",
      citizenAction: "Llenar formulario en línea antes del 30 de septiembre.",
    },
    quc: {
      title: "Tob'anik rech tijonïk",
      summary: "K'o tob'anik rech tijob'al",
      citizenAction: "Chatz'ib'aj la ab'i'",
    },
  },
};

describe("UserDatabase (JsonFileUserDatabase)", () => {
  beforeEach(async () => {
    try {
      await rm(TEST_DB_PATH, { force: true });
    } catch {
      // ignore
    }
  });

  it("registers a user with multiple preferences", async () => {
    const db = new JsonFileUserDatabase(TEST_DB_PATH);
    const user = await db.registerUser("Ana Gómez", "ana@correo.gt", [
      "health_wellbeing",
      "education_scholarships",
    ]);

    expect(user.id).toBeDefined();
    expect(user.name).toBe("Ana Gómez");
    expect(user.email).toBe("ana@correo.gt");
    expect(user.preferences).toEqual(["health_wellbeing", "education_scholarships"]);

    const healthUsers = await db.getUsersByCategory("health_wellbeing");
    expect(healthUsers).toHaveLength(1);
    expect(healthUsers[0].email).toBe("ana@correo.gt");

    const socialUsers = await db.getUsersByCategory("social_programs");
    expect(socialUsers).toHaveLength(0);
  });

  it("updates existing user preferences without duplicating", async () => {
    const db = new JsonFileUserDatabase(TEST_DB_PATH);
    await db.registerUser("Carlos", "carlos@correo.gt", ["health_wellbeing"]);
    const updated = await db.registerUser("Carlos Actualizado", "carlos@correo.gt", [
      "social_programs",
      "security_alerts",
    ]);

    expect(updated.name).toBe("Carlos Actualizado");
    expect(updated.preferences).toEqual(["social_programs", "security_alerts"]);

    const users = await db.listUsers();
    expect(users).toHaveLength(1);
  });

  it("logs notifications and detects duplicates", async () => {
    const db = new JsonFileUserDatabase(TEST_DB_PATH);
    const user = await db.registerUser("Mario", "mario@correo.gt", ["health_wellbeing"]);

    expect(await db.hasUserBeenNotified(user.id, "news-100")).toBe(false);

    await db.logNotification({
      userId: user.id,
      newsId: "news-100",
      categoryId: "health_wellbeing",
      status: "SENT",
      sentAt: new Date().toISOString(),
    });

    expect(await db.hasUserBeenNotified(user.id, "news-100")).toBe(true);
  });
});

describe("EmailTemplate", () => {
  it("renders official HTML with Guatemala colors and citizen action", () => {
    const html = renderNewsHtml("Juan", sampleNews);
    expect(html).toContain("TODOMIGOBGT");
    expect(html).toContain("#4997D0");
    expect(html).toContain("Jornada Nacional de Vacunación");
    expect(html).toContain("Presentarse con DPI y carnet infantil.");
    expect(html).toContain("Salud y Prevención");
  });

  it("renders plain text fallback", () => {
    const text = renderNewsText("Juan", sampleNews);
    expect(text).toContain("TODOMIGOBGT");
    expect(text).toContain("Estimado/a Juan");
    expect(text).toContain("Jornada Nacional de Vacunación");
  });
});

describe("NotificationDispatcher", () => {
  beforeEach(async () => {
    try {
      await rm(TEST_DB_PATH, { force: true });
    } catch {
      // ignore
    }
  });

  it("dispatches news only to subscribers with matching preferences", async () => {
    const db = new JsonFileUserDatabase(TEST_DB_PATH);
    const transport = new MockEmailTransport();
    const dispatcher = new NotificationDispatcher(db, transport);

    // Usuario 1 suscrito a Salud y Educación
    await db.registerUser("Usuario 1", "u1@test.gt", [
      "health_wellbeing",
      "education_scholarships",
    ]);

    // Usuario 2 suscrito únicamente a Educación
    await db.registerUser("Usuario 2", "u2@test.gt", ["education_scholarships"]);

    // Despachar noticia de Salud: solo debe llegar a Usuario 1
    const healthResult = await dispatcher.dispatchNewsItem(sampleNews);
    expect(healthResult.matchedUsersCount).toBe(1);
    expect(healthResult.sentCount).toBe(1);
    expect(transport.sentMessages).toHaveLength(1);
    expect(transport.sentMessages[0].to).toBe("u1@test.gt");

    // Despachar noticia de Educación: debe llegar a Usuario 1 y Usuario 2
    const eduResult = await dispatcher.dispatchNewsItem(sampleNewsEducation);
    expect(eduResult.matchedUsersCount).toBe(2);
    expect(eduResult.sentCount).toBe(2);
    expect(transport.sentMessages).toHaveLength(3);
  });

  it("skips dispatching if the user was already notified", async () => {
    const db = new JsonFileUserDatabase(TEST_DB_PATH);
    const transport = new MockEmailTransport();
    const dispatcher = new NotificationDispatcher(db, transport);

    await db.registerUser("Usuario 1", "u1@test.gt", ["health_wellbeing"]);

    // Primer envío
    const res1 = await dispatcher.dispatchNewsItem(sampleNews);
    expect(res1.sentCount).toBe(1);

    // Segundo envío con la misma noticia
    const res2 = await dispatcher.dispatchNewsItem(sampleNews);
    expect(res2.sentCount).toBe(0);
    expect(res2.alreadyNotifiedCount).toBe(1);
    expect(transport.sentMessages).toHaveLength(1); // No aumentó
  });

  it("renders welcome html and text with one news item per category", () => {
    const categoryNewsList = [
      {
        categoryId: "health_wellbeing",
        news: sampleNews,
      },
      {
        categoryId: "education_scholarships",
        news: sampleNewsEducation,
      },
    ];

    const html = renderWelcomeHtml("Ana Gómez", categoryNewsList);
    expect(html).toContain("Ana Gómez");
    expect(html).toContain("TODOMIGOBGT");
    expect(html).toContain("Salud y Prevención");
    expect(html).toContain("Educación y Becas");
    expect(html).toContain("Jornada Nacional de Vacunación");
    expect(html).toContain("Convocatoria de Becas Universitarias");
    expect(html).toContain("https://todomigobgt.carlosdelcidramirez.workers.dev/buscar/");

    const text = renderWelcomeText("Ana Gómez", categoryNewsList);
    expect(text).toContain("Ana Gómez");
    expect(text).toContain("SALUD Y PREVENCIÓN");
    expect(text).toContain("EDUCACIÓN Y BECAS");
    expect(text).toContain("Jornada Nacional de Vacunación");
  });
});
