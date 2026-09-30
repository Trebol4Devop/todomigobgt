import { describe, expect, it, vi } from "vitest";

import { runPipeline } from "../../../src/app/runPipeline.js";
import type { NewsItem } from "../../../src/domain/news.js";
import { FakeAIProcessor } from "../../helpers/fakeAIProcessor.js";
import { FakeNewsSource } from "../../helpers/fakeNewsSource.js";
import { FakeNewsStorage } from "../../helpers/fakeNewsStorage.js";

const logger = () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const historicalNews: NewsItem = {
  id: "existing-news",
  originalUrl: "https://agn.gt/news/existing",
  source: "AGN",
  sourceType: "news",
  categoryId: "social_programs",
  tags: ["histórico"],
  publishedAt: "2026-09-09T12:00:00Z",
  extractedAt: "2026-09-10T12:00:00Z",
  urgent: false,
  content: {
    es: { title: "Existente", summary: "Resumen", citizenAction: "Consultar" },
    quc: { title: "K'o", summary: "Tz'ib'", citizenAction: "Chawila'" },
  },
};

const newCandidate = {
  source: "AGN",
  sourceType: "news",
  originalUrl: "https://agn.gt/news/new",
  extractedAt: "2026-09-10T12:00:00Z",
  rawContent: "nueva",
};

const accepted = {
  relevant: true as const,
  data: {
    categoryId: "social_programs" as const,
    tags: ["apoyo"],
    urgent: false,
    content: {
      es: { title: "Nueva", summary: "Resumen", citizenAction: "Consultar" },
      quc: { title: "K'ak'", summary: "Tz'ib'", citizenAction: "Chawila'" },
    },
  },
};

describe("runPipeline", () => {
  it("runs a complete dry run and does not save remote storage", async () => {
    const storage = new FakeNewsStorage({
      lastUpdatedAt: "2026-09-09T12:00:00Z",
      totalNews: 1,
      availableCategories: [
        { id: "education_scholarships", name: "Educación y Becas" },
        { id: "health_wellbeing", name: "Salud y Prevención" },
        { id: "social_programs", name: "Apoyo Social" },
        { id: "procedures_services", name: "Trámites y Documentos" },
        { id: "security_alerts", name: "Alertas y Emergencias" },
        { id: "employment_development", name: "Empleo y Emprendimiento" },
      ],
      news: [historicalNews],
    });
    const previewStorage = new FakeNewsStorage();
    const result = await runPipeline({
      storage,
      previewStorage,
      sources: [new FakeNewsSource("AGN", [newCandidate])],
      aiProcessor: new FakeAIProcessor(() => accepted),
      logger: logger(),
      scraperDelayMs: 0,
      dryRun: true,
    });

    expect(result.totalNews).toBe(2);
    expect(storage.saveCalls).toBe(0);
    expect(storage.loadCalls).toBe(1);
    expect(previewStorage.saveCalls).toBe(1);
    expect(previewStorage.savedNewsFile?.totalNews).toBe(2);
  });

  it("aborts publication when every source fails", async () => {
    const storage = new FakeNewsStorage(null);
    const previewStorage = new FakeNewsStorage();

    await expect(
      runPipeline({
        storage,
        previewStorage,
        sources: [new FakeNewsSource("AGN", [], new Error("sitio caído"))],
        aiProcessor: new FakeAIProcessor(() => accepted),
        logger: logger(),
        scraperDelayMs: 0,
        dryRun: false,
      }),
    ).rejects.toThrow("No fue posible consultar ninguna fuente");
    expect(storage.saveCalls).toBe(0);
  });

  it("dispatches notifications when new news items are processed", async () => {
    const storage = new FakeNewsStorage(null);
    const previewStorage = new FakeNewsStorage();
    const fakeDispatcher = {
      dispatchNewsBatch: vi.fn().mockResolvedValue([]),
      dispatchNewsItem: vi.fn(),
    };

    await runPipeline({
      storage,
      previewStorage,
      sources: [new FakeNewsSource("AGN", [newCandidate])],
      aiProcessor: new FakeAIProcessor(() => accepted),
      logger: logger(),
      scraperDelayMs: 0,
      dryRun: true,
      notificationDispatcher: fakeDispatcher as any,
    });

    expect(fakeDispatcher.dispatchNewsBatch).toHaveBeenCalledTimes(1);
    expect(fakeDispatcher.dispatchNewsBatch).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          categoryId: "social_programs",
        }),
      ]),
    );
  });
});
