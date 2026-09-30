import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { CATEGORY_IDS, type CategoryId } from "../domain/categories.js";
import type { NotificationLog, UserDatabase, UserSubscription } from "./types.js";

interface DatabaseFileSchema {
  users: Array<{
    id: number;
    name: string;
    email: string;
    preferences: CategoryId[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  notificationLogs: Array<{
    id: number;
    userId: number | string;
    newsId: string;
    categoryId: CategoryId;
    status: "SENT" | "FAILED";
    sentAt: string;
    errorMessage?: string;
  }>;
  nextUserId: number;
  nextLogId: number;
}

export class JsonFileUserDatabase implements UserDatabase {
  private readonly filePath: string;
  private cache: DatabaseFileSchema | null = null;

  constructor(filePath: string = "./data/todomigobgt.json") {
    this.filePath = filePath;
  }

  private async load(): Promise<DatabaseFileSchema> {
    if (this.cache !== null) {
      return this.cache;
    }

    try {
      const content = await readFile(this.filePath, "utf-8");
      this.cache = JSON.parse(content) as DatabaseFileSchema;
      return this.cache;
    } catch {
      // Si el archivo no existe, inicializar con estructura limpia
      this.cache = {
        users: [],
        notificationLogs: [],
        nextUserId: 1,
        nextLogId: 1,
      };
      return this.cache;
    }
  }

  private async persist(): Promise<void> {
    if (this.cache === null) {
      return;
    }
    const dir = dirname(this.filePath);
    await mkdir(dir, { recursive: true });
    await writeFile(this.filePath, JSON.stringify(this.cache, null, 2), "utf-8");
  }

  async registerUser(
    name: string,
    email: string,
    preferences: CategoryId[],
  ): Promise<UserSubscription> {
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      throw new Error("El nombre de usuario es obligatorio.");
    }
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      throw new Error("El correo electrónico es inválido.");
    }

    const validCategories = preferences.filter((cat) => CATEGORY_IDS.includes(cat));
    const uniquePreferences = Array.from(new Set(validCategories));

    const db = await this.load();
    const now = new Date().toISOString();

    const existingUserIndex = db.users.findIndex(
      (u) => u.email.toLowerCase() === normalizedEmail,
    );

    if (existingUserIndex >= 0) {
      const existing = db.users[existingUserIndex];
      const updated: UserSubscription = {
        ...existing,
        name: trimmedName,
        preferences: uniquePreferences,
        isActive: true,
        updatedAt: now,
      };
      db.users[existingUserIndex] = updated;
      await this.persist();
      return updated;
    }

    const newUser: UserSubscription = {
      id: db.nextUserId++,
      name: trimmedName,
      email: normalizedEmail,
      preferences: uniquePreferences,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    db.users.push(newUser);
    await this.persist();
    return newUser;
  }

  async getUsersByCategory(categoryId: CategoryId): Promise<UserSubscription[]> {
    const db = await this.load();
    return db.users.filter(
      (u) => u.isActive && u.preferences.includes(categoryId),
    );
  }

  async listUsers(): Promise<UserSubscription[]> {
    const db = await this.load();
    return [...db.users];
  }

  async hasUserBeenNotified(userId: string | number, newsId: string): Promise<boolean> {
    const db = await this.load();
    return db.notificationLogs.some(
      (log) => String(log.userId) === String(userId) && log.newsId === newsId && log.status === "SENT",
    );
  }

  async logNotification(log: NotificationLog): Promise<void> {
    const db = await this.load();
    db.notificationLogs.push({
      id: db.nextLogId++,
      userId: log.userId,
      newsId: log.newsId,
      categoryId: log.categoryId,
      status: log.status,
      sentAt: log.sentAt,
      errorMessage: log.errorMessage,
    });
    await this.persist();
  }
}
