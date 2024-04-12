import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModal from "./userModal";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    const error = createHttpError(400, "All fields are Required");
    return next(error);
  }

  const user = await userModal.findOne({ email });

  if (user) {
    const error = createHttpError(500, "User already exists");
    return next(error);
  }

  res.json({ message: " user Registered successfully" });
};

export { createUser };
