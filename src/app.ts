import express from "express";
import globalErrorHandler from "./middleware/globalErrorHandler";
import userRouter from "./user/userRouter";
import bookRouter from "./book/bookRouter";
import cors from "cors";
import { config } from "./config/config";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: config.frontend_domain,
  })
);

app.get("/", (req, res) => {
  res.json({ success: true });
});

app.use("/api/users", userRouter);
app.use("/api/books", bookRouter);

//Global Error Handler
app.use(globalErrorHandler);

export default app;
