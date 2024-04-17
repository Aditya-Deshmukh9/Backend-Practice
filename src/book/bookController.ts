import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import fs from "node:fs";
import createHttpError from "http-errors";
import bookModel from "./bookModel";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("filesdata", req.files);

    const { title, genre } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const coverImageMineType = files.coverImage[0].mimetype.split("/").at(-1);
    const filename = files.coverImage[0].filename;
    const filepath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      filename
    );
    const uploadFiles = await cloudinary.uploader.upload(filepath, {
      filename_override: filename,
      folder: "book_covers",
      format: coverImageMineType,
    });

    //PDF file

    const bookfilename = files.file[0].filename;
    const bookfilepath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      bookfilename
    );

    const bookFileUpload = await cloudinary.uploader.upload(bookfilepath, {
      resource_type: "raw",
      filename_override: bookfilename,
      folder: "book_pdfs",
      format: "pdf",
    });

    console.log("bookFileUpload", bookFileUpload);

    console.log("uploadFiles", uploadFiles);

    const newBook = await bookModel.create({
      title,
      genre,
      author: "66191fdc50f5b9969f71957c",
      coverImage: uploadFiles.secure_url,
      file: bookFileUpload.secure_url,
    });

    try {
      await fs.promises.unlink(filepath);
      await fs.promises.unlink(bookfilepath);
    } catch (error) {
      console.log("Error while delete uploaded files", error);
    }

    res.status(201).json({ data: newBook });
  } catch (error) {
    console.log(error);
    return next(createHttpError("500", "Error while uploading files"));
  }
};

export { createBook };
