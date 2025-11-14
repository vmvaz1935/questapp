import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { logger } from "./config/logger";
import authRoutes from "./routes/auth";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/auth", authRoutes);

app.use(
  (error: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err: error }, "Erro não tratado");
    res.status(500).json({ error: "Erro interno do servidor" });
  },
);

const port = Number(process.env.PORT ?? 4000);

const server = app.listen(port, () => {
  logger.info({ port }, "Servidor iniciado");
});

const shutdown = (signal: string) => {
  logger.info({ signal }, "Encerrando servidor");
  server.close(() => {
    logger.info("Servidor encerrado com sucesso");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled Rejection");
});
process.on("uncaughtException", (error) => {
  logger.error({ err: error }, "Uncaught Exception");
  process.exit(1);
});

export { app };
