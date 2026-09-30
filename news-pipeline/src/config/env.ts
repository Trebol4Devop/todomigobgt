import { z } from "zod";

import {
  DEFAULT_AI_MAX_RETRIES,
  DEFAULT_AI_TIMEOUT_MS,
  DEFAULT_NOTIFICATION_DB_PATH,
  DEFAULT_OUTPUT_PREVIEW_PATH,
  DEFAULT_R2_OBJECT_KEY,
  DEFAULT_SCRAPER_DELAY_MS,
  DEFAULT_SCRAPER_MAX_RETRIES,
  DEFAULT_SCRAPER_MAX_CANDIDATES,
  DEFAULT_SCRAPER_TIMEOUT_MS,
  DEFAULT_SCRAPER_USER_AGENT,
  DEFAULT_SMTP_APP_NAME,
  DEFAULT_SMTP_HOST,
  DEFAULT_SMTP_PASS,
  DEFAULT_SMTP_PORT,
} from "./constants.js";
import { ConfigurationError } from "../errors/ConfigurationError.js";

const emptyToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = z.preprocess(emptyToUndefined, z.string().trim().min(1).optional());

const positiveInteger = (defaultValue: number) =>
  z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(defaultValue));

const nonNegativeInteger = (defaultValue: number) =>
  z.preprocess(emptyToUndefined, z.coerce.number().int().nonnegative().default(defaultValue));

const booleanFromEnvironment = z.preprocess((value) => {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return value;
}, z.boolean().default(true));

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  DEEPSEEK_API_KEY: optionalText,
  DEEPSEEK_BASE_URL: optionalText,
  DEEPSEEK_MODEL: optionalText,
  R2_ACCOUNT_ID: optionalText,
  R2_ACCESS_KEY_ID: optionalText,
  R2_SECRET_ACCESS_KEY: optionalText,
  R2_BUCKET_NAME: optionalText,
  R2_OBJECT_KEY: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).default(DEFAULT_R2_OBJECT_KEY),
  ),
  SCRAPER_USER_AGENT: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).default(DEFAULT_SCRAPER_USER_AGENT),
  ),
  SCRAPER_TIMEOUT_MS: positiveInteger(DEFAULT_SCRAPER_TIMEOUT_MS),
  SCRAPER_DELAY_MS: nonNegativeInteger(DEFAULT_SCRAPER_DELAY_MS),
  SCRAPER_MAX_RETRIES: nonNegativeInteger(DEFAULT_SCRAPER_MAX_RETRIES),
  SCRAPER_MAX_CANDIDATES: positiveInteger(DEFAULT_SCRAPER_MAX_CANDIDATES),
  AI_TIMEOUT_MS: positiveInteger(DEFAULT_AI_TIMEOUT_MS),
  AI_MAX_RETRIES: nonNegativeInteger(DEFAULT_AI_MAX_RETRIES),
  DRY_RUN: booleanFromEnvironment,
  OUTPUT_PREVIEW_PATH: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).default(DEFAULT_OUTPUT_PREVIEW_PATH),
  ),
  SMTP_HOST: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).default(DEFAULT_SMTP_HOST),
  ),
  SMTP_PORT: positiveInteger(DEFAULT_SMTP_PORT),
  SMTP_USER: optionalText,
  SMTP_PASS: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).default(DEFAULT_SMTP_PASS),
  ),
  SMTP_APP_NAME: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).default(DEFAULT_SMTP_APP_NAME),
  ),
  NOTIFICATIONS_ENABLED: booleanFromEnvironment,
  NOTIFICATION_DB_PATH: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).default(DEFAULT_NOTIFICATION_DB_PATH),
  ),
});

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface EnvironmentConfig {
  nodeEnv: "development" | "test" | "production";
  logLevel: LogLevel;
  deepSeek: {
    apiKey: string | undefined;
    baseUrl: string | undefined;
    model: string | undefined;
    timeoutMs: number;
    maxRetries: number;
  };
  r2: {
    accountId: string | undefined;
    accessKeyId: string | undefined;
    secretAccessKey: string | undefined;
    bucketName: string | undefined;
    objectKey: string;
  };
  scraper: {
    userAgent: string;
    timeoutMs: number;
    delayMs: number;
    maxRetries: number;
    maxCandidates: number;
  };
  dryRun: boolean;
  outputPreviewPath: string;
  notifications: {
    enabled: boolean;
    dbPath: string;
    smtp: {
      host: string;
      port: number;
      user: string | undefined;
      pass: string;
      appName: string;
    };
  };
}

export interface DeepSeekConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  maxRetries: number;
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  objectKey: string;
}

export function loadEnvironmentConfig(
  environment: NodeJS.ProcessEnv = process.env,
): EnvironmentConfig {
  const parsed = environmentSchema.safeParse(environment);

  if (!parsed.success) {
    throw new ConfigurationError("La configuración de entorno es inválida", {
      cause: parsed.error,
    });
  }

  const env = parsed.data;
  return {
    nodeEnv: env.NODE_ENV,
    logLevel: env.LOG_LEVEL,
    deepSeek: {
      apiKey: env.DEEPSEEK_API_KEY,
      baseUrl: env.DEEPSEEK_BASE_URL,
      model: env.DEEPSEEK_MODEL,
      timeoutMs: env.AI_TIMEOUT_MS,
      maxRetries: env.AI_MAX_RETRIES,
    },
    r2: {
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucketName: env.R2_BUCKET_NAME,
      objectKey: env.R2_OBJECT_KEY,
    },
    scraper: {
      userAgent: env.SCRAPER_USER_AGENT,
      timeoutMs: env.SCRAPER_TIMEOUT_MS,
      delayMs: env.SCRAPER_DELAY_MS,
      maxRetries: env.SCRAPER_MAX_RETRIES,
      maxCandidates: env.SCRAPER_MAX_CANDIDATES,
    },
    dryRun: env.DRY_RUN,
    outputPreviewPath: env.OUTPUT_PREVIEW_PATH,
    notifications: {
      enabled: env.NOTIFICATIONS_ENABLED,
      dbPath: env.NOTIFICATION_DB_PATH,
      smtp: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
        appName: env.SMTP_APP_NAME,
      },
    },
  };
}

export function requireDeepSeekConfig(config: EnvironmentConfig): DeepSeekConfig {
  const { apiKey, baseUrl, model, timeoutMs, maxRetries } = config.deepSeek;

  if (!apiKey) {
    throw new ConfigurationError("Falta la variable de entorno DEEPSEEK_API_KEY");
  }
  if (!baseUrl) {
    throw new ConfigurationError("Falta la variable de entorno DEEPSEEK_BASE_URL");
  }
  if (!model) {
    throw new ConfigurationError("Falta la variable de entorno DEEPSEEK_MODEL");
  }

  return { apiKey, baseUrl, model, timeoutMs, maxRetries };
}

export function requireR2Config(config: EnvironmentConfig): R2Config {
  const { accountId, accessKeyId, secretAccessKey, bucketName, objectKey } = config.r2;

  if (!accountId) {
    throw new ConfigurationError("Falta la variable de entorno R2_ACCOUNT_ID");
  }
  if (!accessKeyId) {
    throw new ConfigurationError("Falta la variable de entorno R2_ACCESS_KEY_ID");
  }
  if (!secretAccessKey) {
    throw new ConfigurationError("Falta la variable de entorno R2_SECRET_ACCESS_KEY");
  }
  if (!bucketName) {
    throw new ConfigurationError("Falta la variable de entorno R2_BUCKET_NAME");
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, objectKey };
}
