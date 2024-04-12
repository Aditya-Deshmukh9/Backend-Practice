import { NextFunction, Request, Response } from "express";
import { HttpError } from "http-errors";
import { config } from "../config/config";

const globalErrorHandler = (
  err: HttpError,
  req: Request,
  res: Response,
  Next: NextFunction
) => {
  const statuscode = err.statusCode || 500;

  return res.status(statuscode).json({
    message: err.message,
    erroeStack: config.env === "development" ? err.stack : "",
  });
};

export default globalErrorHandler;
