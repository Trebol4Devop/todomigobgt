import { connect as tlsConnect } from "node:tls";
import type { EmailMessage, EmailTransport } from "./types.js";
import { renderNewsHtml, renderNewsText, getCategoryDisplayName } from "./emailTemplate.js";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  senderName?: string;
}

export class MockEmailTransport implements EmailTransport {
  public sentMessages: Array<{ to: string; subject: string; newsId: string }> = [];

  async send(message: EmailMessage): Promise<void> {
    const categoryName = getCategoryDisplayName(message.news.categoryId);
    const subject = `[TODOMIGOBGT] ${categoryName}: ${message.news.content.es.title}`;
    this.sentMessages.push({
      to: message.to,
      subject,
      newsId: message.news.id,
    });
  }
}

/**
 * Cliente SMTP nativo sobre TLS/SSL (puerto 465) sin librerías externas.
 * Garantiza compatibilidad 100% en cualquier versión de Node.js en Raspberry Pi.
 */
export class NativeSmtpEmailTransport implements EmailTransport {
  private readonly config: SmtpConfig;

  constructor(config: SmtpConfig) {
    this.config = {
      ...config,
      pass: config.pass.replace(/\s+/g, ""), // Limpiar espacios de la contraseña de app
      senderName: config.senderName ?? "TODOMIGOBGT Alertas Ciudadanas",
    };
  }

  async send(message: EmailMessage): Promise<void> {
    if (!this.config.user) {
      throw new Error("Falta la variable de entorno SMTP_USER con la dirección de correo Gmail.");
    }

    const categoryName = getCategoryDisplayName(message.news.categoryId);
    const subject = `[TODOMIGOBGT] ${categoryName}: ${message.news.content.es.title}`;
    const html = renderNewsHtml(message.userName, message.news);
    const text = renderNewsText(message.userName, message.news);

    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const mimeMessage = [
      `From: =?utf-8?B?${Buffer.from(this.config.senderName!).toString("base64")}?= <${this.config.user}>`,
      `To: <${message.to}>`,
      `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=utf-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      Buffer.from(text, "utf-8").toString("base64"),
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      Buffer.from(html, "utf-8").toString("base64"),
      ``,
      `--${boundary}--`,
      ``,
    ].join("\r\n");

    await this.executeSmtpTransaction(message.to, mimeMessage);
  }

  private executeSmtpTransaction(recipient: string, mimeMessage: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = tlsConnect(
        {
          host: this.config.host,
          port: this.config.port,
          rejectUnauthorized: true,
        },
        () => {
          // Conectado por TLS
        },
      );

      let step = 0;
      let buffer = "";

      const sendCommand = (cmd: string) => {
        socket.write(cmd + "\r\n");
      };

      socket.on("data", (chunk) => {
        buffer += chunk.toString("utf-8");
        const lines = buffer.split("\r\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line) continue;
          const code = parseInt(line.substring(0, 3), 10);

          // Verificar si es línea final de respuesta multilínea
          const isFinalLine = line.charAt(3) === " ";
          if (!isFinalLine) continue;

          if (code >= 400) {
            socket.end();
            return reject(new Error(`Error del servidor SMTP (${code}): ${line}`));
          }

          if (step === 0 && code === 220) {
            step = 1;
            sendCommand("EHLO todomigobgt.gob.gt");
          } else if (step === 1 && code === 250) {
            step = 2;
            sendCommand("AUTH LOGIN");
          } else if (step === 2 && code === 334) {
            step = 3;
            // Enviar usuario en base64
            sendCommand(Buffer.from(this.config.user).toString("base64"));
          } else if (step === 3 && code === 334) {
            step = 4;
            // Enviar contraseña de aplicación en base64
            sendCommand(Buffer.from(this.config.pass).toString("base64"));
          } else if (step === 4 && code === 235) {
            step = 5;
            sendCommand(`MAIL FROM:<${this.config.user}>`);
          } else if (step === 5 && code === 250) {
            step = 6;
            sendCommand(`RCPT TO:<${recipient}>`);
          } else if (step === 6 && code === 250) {
            step = 7;
            sendCommand("DATA");
          } else if (step === 7 && code === 354) {
            step = 8;
            socket.write(mimeMessage + "\r\n.\r\n");
          } else if (step === 8 && code === 250) {
            step = 9;
            sendCommand("QUIT");
            resolve();
          }
        }
      });

      socket.on("error", (err) => {
        reject(err);
      });

      socket.setTimeout(15000, () => {
        socket.destroy();
        reject(new Error("Tiempo de espera agotado al conectar con el servidor SMTP."));
      });
    });
  }
}
