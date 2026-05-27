import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import crypto from "node:crypto";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

/*
 * Custom request logging middleware (replaces pino-http).
 * Adds a child logger to each request and logs start/finish.
 * Avoids import issues with pino-http in certain build environments.
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const child = logger.child({ reqId: (req as unknown as Record<string, unknown>).id ?? crypto.randomUUID() });
  (req as unknown as Record<string, unknown>).log = child;

  child.info(
    {
      req: {
        method: req.method,
        url: req.url?.split("?")[0],
      },
    },
    "request started",
  );

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const logObj = {
      res: { statusCode: res.statusCode },
      responseTime: duration,
    };
    if (res.statusCode >= 500) {
      child.error(logObj, "request completed");
    } else if (res.statusCode >= 400) {
      child.warn(logObj, "request completed");
    } else {
      child.info(logObj, "request completed");
    }
  });

  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
