import type { AIProcessor } from "../ai/aiProcessor.js";
import type { NewsFile } from "../domain/newsFile.js";
import { deduplicateCandidates } from "../deduplication/deduplicateCandidates.js";
import { SourceError } from "../errors/SourceError.js";
import { validateNewsFile } from "../validation/validateNewsFile.js";
import type { NewsSource } from "../sources/newsSource.js";
import type { NewsStorage } from "../storage/newsStorage.js";
import type { Clock } from "../utils/dates.js";
import { collectCandidates } from "../services/collectCandidates.js";
import { consolidateNews } from "../services/consolidateNews.js";
import { loadHistoricalNews } from "../services/loadHistoricalNews.js";
import { processCandidates } from "../services/processCandidates.js";
import { publishNews } from "../services/publishNews.js";
import type { Logger } from "../utils/logger.js";
import type { Sleep } from "../utils/sleep.js";
import type { NotificationDispatcher } from "../notifications/notificationDispatcher.js";

export interface PipelineDependencies {
  storage: NewsStorage;
  previewStorage: NewsStorage;
  sources: readonly NewsSource[];
  aiProcessor: AIProcessor;
  logger: Logger;
  scraperDelayMs: number;
  dryRun: boolean;
  clock?: Clock;
  sleep?: Sleep;
  notificationDispatcher?: NotificationDispatcher;
}

export async function runPipeline(dependencies: PipelineDependencies): Promise<NewsFile> {
  dependencies.logger.info("Pipeline iniciado");

  const historicalFile = await loadHistoricalNews(
    dependencies.storage,
    dependencies.logger,
    dependencies.clock,
  );
  const collection = await collectCandidates(dependencies.sources, {
    delayMs: dependencies.scraperDelayMs,
    logger: dependencies.logger,
    ...(dependencies.sleep === undefined ? {} : { sleep: dependencies.sleep }),
  });

  if (collection.allSourcesFailed) {
    throw new SourceError("No fue posible consultar ninguna fuente; no se publicará el histórico");
  }

  dependencies.logger.info(`${collection.candidates.length} candidatos encontrados en total`);
  const deduplication = deduplicateCandidates(collection.candidates, historicalFile.news);
  dependencies.logger.info(`${deduplication.duplicateCount} duplicados descartados`);
  dependencies.logger.info(`${deduplication.candidates.length} candidatos nuevos`);

  const processed = await processCandidates(
    deduplication.candidates,
    dependencies.aiProcessor,
    dependencies.logger,
  );

  if (dependencies.notificationDispatcher && processed.news.length > 0) {
    dependencies.logger.info(
      `Despachando notificaciones por correo para ${processed.news.length} noticias nuevas`,
    );
    await dependencies.notificationDispatcher.dispatchNewsBatch(processed.news);
  }

  dependencies.logger.info("Consolidando histórico");
  const finalFile = consolidateNews(historicalFile.news, processed.news, dependencies.clock);

  const validatedFile = validateNewsFile(finalFile);
  dependencies.logger.info("Documento final validado correctamente");

  if (dependencies.dryRun) {
    dependencies.logger.info("Modo de prueba activado");
    dependencies.logger.info("El archivo remoto no será modificado");
    await dependencies.previewStorage.save(validatedFile);
    dependencies.logger.info("Preview guardado localmente");
  } else {
    await publishNews(dependencies.storage, validatedFile, dependencies.logger);
  }

  dependencies.logger.info("Pipeline completado correctamente");
  return validatedFile;
}
