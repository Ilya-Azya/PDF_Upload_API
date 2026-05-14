import express, { NextFunction, Request, Response } from "express";
import { router } from "./routes";

export const app = express();

app.use(express.json());
app.use(router);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

app.use(
  (error: Error, _req: Request, res: Response, _next: NextFunction): void => {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  },
);
