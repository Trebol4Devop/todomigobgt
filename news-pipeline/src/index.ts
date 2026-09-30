import { pathToFileURL } from "node:url";

import { MockAIProcessor } from "./ai/providers/mockProcessor.js";
import { DeepSeekProcessor } from "./ai/providers/deepseekProcessor.js";
import { requireDeepSeekConfig, requireR2Config, loadEnvironmentConfig } from "./config/env.js";
import { runPipeline, type PipelineDependencies } from "./app/runPipeline.js";
import { AgnNewsSource } from "./sources/providers/agnSource.js";
import { MockNewsSource } from "./sources/providers/mockSource.js";
import { SegeplanNewsSource } from "./sources/providers/segeplanSource.js";
import { ConredNewsSource } from "./sources/providers/ministries/conredSource.js";
import { MintrabNewsSource } from "./sources/providers/ministries/mintrabSource.js";
import { MspasNewsSource } from "./sources/providers/ministries/mspasSource.js";
import { MingobNewsSource } from "./sources/providers/ministries/mingobSource.js";
import { InsivumehNewsSource } from "./sources/providers/ministries/insivumehSource.js";
import { MineducNewsSource } from "./sources/providers/ministries/mineducSource.js";
import { MarnNewsSource } from "./sources/providers/ministries/marnSource.js";
import { IgssNewsSource } from "./sources/providers/ministries/igssSource.js";
import { CivNewsSource } from "./sources/providers/ministries/civSource.js";
import { SatNewsSource } from "./sources/providers/ministries/satSource.js";
import { MagaNewsSource, MidesNewsSource, InabNewsSource, ConadiNewsSource, PdhNewsSource } from "./sources/providers/ministries/additionalSources.js";
import { SourceRegistry } from "./sources/sourceRegistry.js";
import { NativeHttpClient } from "./scraping/httpClient.js";
import { LocalNewsStorage } from "./storage/localNewsStorage.js";
import { R2NewsStorage } from "./storage/r2NewsStorage.js";
import type { NewsStorage } from "./storage/newsStorage.js";
import { createLogger } from "./utils/logger.js";
import { JsonFileUserDatabase } from "./notifications/database.js";
import { NativeSmtpEmailTransport, MockEmailTransport } from "./notifications/emailTransport.js";
import { NotificationDispatcher } from "./notifications/notificationDispatcher.js";

export function createDependencies(): PipelineDependencies {
  const config = loadEnvironmentConfig();
  const logger = createLogger(config.logLevel);
  const storage = createStorage(config);
  const previewStorage = new LocalNewsStorage(config.outputPreviewPath);
  const sources = new SourceRegistry(
    config.nodeEnv === "production"
      ? [...createProductionSources(config)]
      : [new MockNewsSource("MOCK")],
  );

  const notificationDb = new JsonFileUserDatabase(config.notifications.dbPath);
  const emailTransport =
    config.notifications.smtp.user && config.nodeEnv === "production"
      ? new NativeSmtpEmailTransport({
          host: config.notifications.smtp.host,
          port: config.notifications.smtp.port,
          user: config.notifications.smtp.user,
          pass: config.notifications.smtp.pass,
          senderName: config.notifications.smtp.appName,
        })
      : new MockEmailTransport();

  const notificationDispatcher = config.notifications.enabled
    ? new NotificationDispatcher(notificationDb, emailTransport, logger)
    : undefined;

  return {
    storage,
    previewStorage,
    sources: sources.list(),
    aiProcessor:
      config.nodeEnv === "production"
        ? new DeepSeekProcessor(requireDeepSeekConfig(config))
        : new MockAIProcessor(),
    logger,
    scraperDelayMs: config.scraper.delayMs,
    dryRun: config.dryRun,
    notificationDispatcher,
  };
}

function createProductionSources(config: ReturnType<typeof loadEnvironmentConfig>) {
  const fetchOptions = {
    timeoutMs: config.scraper.timeoutMs,
    userAgent: config.scraper.userAgent,
    maxRetries: config.scraper.maxRetries,
    delayMs: config.scraper.delayMs,
  };
  const client = new NativeHttpClient();
  return [
    new AgnNewsSource(client, { fetchOptions, maxCandidates: config.scraper.maxCandidates }),
    new SegeplanNewsSource(client, {
      fetchOptions,
      maxCandidates: config.scraper.maxCandidates,
    }),
    new ConredNewsSource(client, {
      fetchOptions,
      maxCandidates: config.scraper.maxCandidates,
    }),
    new MintrabNewsSource(client, {
      fetchOptions,
      maxCandidates: config.scraper.maxCandidates,
    }),
    new MspasNewsSource(client, {
      fetchOptions,
      maxCandidates: config.scraper.maxCandidates,
    }),
    new MingobNewsSource(client, {
      fetchOptions,
      maxCandidates: config.scraper.maxCandidates,
    }),
    new InsivumehNewsSource(client, {
      fetchOptions,
      maxCandidates: config.scraper.maxCandidates,
    }),
    new MineducNewsSource(client, { fetchOptions, maxCandidates: config.scraper.maxCandidates }),
    new MarnNewsSource(client, { fetchOptions, maxCandidates: config.scraper.maxCandidates }),
    new IgssNewsSource(client, { fetchOptions, maxCandidates: config.scraper.maxCandidates }),
    new CivNewsSource(client, { fetchOptions, maxCandidates: config.scraper.maxCandidates }),
    new SatNewsSource(client, { fetchOptions, maxCandidates: config.scraper.maxCandidates }),
    new MagaNewsSource(client, { fetchOptions, maxCandidates: config.scraper.maxCandidates }),
    new MidesNewsSource(client, { fetchOptions, maxCandidates: config.scraper.maxCandidates }),
    new InabNewsSource(client, { fetchOptions, maxCandidates: config.scraper.maxCandidates }),
    new ConadiNewsSource(client, { fetchOptions, maxCandidates: config.scraper.maxCandidates }),
    new PdhNewsSource(client, { fetchOptions, maxCandidates: config.scraper.maxCandidates }),
  ];
}

export async function main(): Promise<void> {
  await runPipeline(createDependencies());
}

const isEntrypoint =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isEntrypoint) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error(`[ERROR] El pipeline terminó con un error fatal: ${message}`);
    process.exitCode = 1;
  });
}

export function createStorage(config: ReturnType<typeof loadEnvironmentConfig>): NewsStorage {
  const hasR2Configuration =
    config.r2.accountId !== undefined &&
    config.r2.accessKeyId !== undefined &&
    config.r2.secretAccessKey !== undefined &&
    config.r2.bucketName !== undefined;

  if (config.nodeEnv === "production" && !config.dryRun) {
    return new R2NewsStorage(requireR2Config(config));
  }
  if (hasR2Configuration) {
    return new R2NewsStorage(requireR2Config(config));
  }

  return new LocalNewsStorage("./output/noticias.json");
}
