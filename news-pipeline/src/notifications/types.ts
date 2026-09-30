import type { CategoryId } from "../domain/categories.js";
import type { NewsItem } from "../domain/news.js";

export interface UserSubscription {
  id: string | number;
  name: string;
  email: string;
  preferences: CategoryId[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NotificationStatus = "SENT" | "FAILED" | "SKIPPED_ALREADY_NOTIFIED";

export interface NotificationLog {
  id?: number | string;
  userId: string | number;
  newsId: string;
  categoryId: CategoryId;
  status: "SENT" | "FAILED";
  sentAt: string;
  errorMessage?: string;
}

export interface UserDatabase {
  registerUser(name: string, email: string, preferences: CategoryId[]): Promise<UserSubscription>;
  getUsersByCategory(categoryId: CategoryId): Promise<UserSubscription[]>;
  listUsers(): Promise<UserSubscription[]>;
  hasUserBeenNotified(userId: string | number, newsId: string): Promise<boolean>;
  logNotification(log: NotificationLog): Promise<void>;
}

export interface EmailMessage {
  to: string;
  userName: string;
  news: NewsItem;
}

export interface EmailTransport {
  send(message: EmailMessage): Promise<void>;
}

export interface DispatchItemResult {
  userId: string | number;
  email: string;
  status: NotificationStatus;
  error?: string;
}

export interface NewsDispatchResult {
  newsId: string;
  categoryId: CategoryId;
  matchedUsersCount: number;
  sentCount: number;
  alreadyNotifiedCount: number;
  failedCount: number;
  details: DispatchItemResult[];
}
