import express, { Request, Response, NextFunction } from "express";
import createHttpError, { HttpError } from "http-errors";
import { config } from "./config/config";
import globalErrorHandler from "./middleware/globalErrorHandler";

const app = express();

app.get("/", (req, res) => {
  const error = createHttpError(400, "something wnt wrong");
  throw error;

  res.json({ success: true });
});

//Global Error Handler
app.use(globalErrorHandler);

export default app;
