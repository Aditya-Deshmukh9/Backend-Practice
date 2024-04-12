import express from "express";
import globalErrorHandler from "./middleware/globalErrorHandler";
import userRouter from "./user/userRouter";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ success: true });
});

app.use("/api/users", userRouter);

//Global Error Handler
app.use(globalErrorHandler);

export default app;
