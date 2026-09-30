import type { NewsItem } from "../domain/news.js";
import type { Logger } from "../utils/logger.js";
import type {
  EmailTransport,
  NewsDispatchResult,
  UserDatabase,
  DispatchItemResult,
} from "./types.js";

export class NotificationDispatcher {
  constructor(
    private readonly database: UserDatabase,
    private readonly transport: EmailTransport,
    private readonly logger?: Logger,
  ) {}

  async dispatchNewsItem(news: NewsItem): Promise<NewsDispatchResult> {
    const targetUsers = await this.database.getUsersByCategory(news.categoryId);
    this.logger?.info(
      `Noticia '${news.id}' (${news.categoryId}): ${targetUsers.length} usuarios suscritos encontrados.`,
    );

    const details: DispatchItemResult[] = [];
    let sentCount = 0;
    let alreadyNotifiedCount = 0;
    let failedCount = 0;

    for (const user of targetUsers) {
      const alreadyNotified = await this.database.hasUserBeenNotified(user.id, news.id);

      if (alreadyNotified) {
        alreadyNotifiedCount++;
        details.push({
          userId: user.id,
          email: user.email,
          status: "SKIPPED_ALREADY_NOTIFIED",
        });
        continue;
      }

      try {
        await this.transport.send({
          to: user.email,
          userName: user.name,
          news,
        });

        await this.database.logNotification({
          userId: user.id,
          newsId: news.id,
          categoryId: news.categoryId,
          status: "SENT",
          sentAt: new Date().toISOString(),
        });

        sentCount++;
        details.push({
          userId: user.id,
          email: user.email,
          status: "SENT",
        });
        this.logger?.info(`Notificación de noticia '${news.id}' enviada a ${user.email}`);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await this.database.logNotification({
          userId: user.id,
          newsId: news.id,
          categoryId: news.categoryId,
          status: "FAILED",
          sentAt: new Date().toISOString(),
          errorMessage: errorMsg,
        });

        failedCount++;
        details.push({
          userId: user.id,
          email: user.email,
          status: "FAILED",
          error: errorMsg,
        });
        this.logger?.warn(`Fallo al enviar notificación a ${user.email}: ${errorMsg}`);
      }
    }

    return {
      newsId: news.id,
      categoryId: news.categoryId,
      matchedUsersCount: targetUsers.length,
      sentCount,
      alreadyNotifiedCount,
      failedCount,
      details,
    };
  }

  async dispatchNewsBatch(newsItems: readonly NewsItem[]): Promise<NewsDispatchResult[]> {
    const results: NewsDispatchResult[] = [];
    for (const news of newsItems) {
      const res = await this.dispatchNewsItem(news);
      results.push(res);
    }
    return results;
  }
}
