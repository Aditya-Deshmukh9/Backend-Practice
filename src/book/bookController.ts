import { NextFunction, Request, Response, raw } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import bookModel from "./bookModel";
import fs from "node:fs";
import createHttpError from "http-errors";
import { AuthRequest } from "../middleware/authinticate";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
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

    const _req = req as AuthRequest;

    const newBook = await bookModel.create({
      title,
      genre,
      author: _req.userId,
      coverImage: uploadFiles.secure_url,
      file: bookFileUpload.secure_url,
    });

    try {
      await fs.promises.unlink(filepath);
      await fs.promises.unlink(bookfilepath);
    } catch (error) {
      return next(createHttpError("401", "Error while delete uploaded files"));
    }

    res.status(201).json({ data: newBook });
  } catch (error) {
    return next(createHttpError("500", "error while creating book"));
  }
};

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;
  const bookId = req.params.bookId;

  const book = await bookModel.findOne({ _id: bookId });

  if (!book) {
    return next(createHttpError(404, "Book not found"));
  }

  // Check access
  const _req = req as AuthRequest;
  if (book.author.toString() !== _req.userId) {
    return next(createHttpError(403, "You can not update others book."));
  }

  // check if image field is exists.

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  let completeCoverImage = "";
  if (files.coverImage) {
    const filename = files.coverImage[0].filename;
    const converMimeType = files.coverImage[0].mimetype.split("/").at(-1);
    // send files to cloudinary
    const filePath = path.resolve(
      __dirname,
      "../../public/data/uploads/" + filename
    );
    completeCoverImage = filename;
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: completeCoverImage,
      folder: "book-covers",
      format: converMimeType,
    });

    completeCoverImage = uploadResult.secure_url;
    await fs.promises.unlink(filePath);
  }

  // check if file field is exists.
  let completeFileName = "";
  if (files.file) {
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads/" + files.file[0].filename
    );

    const bookFileName = files.file[0].filename;
    completeFileName = bookFileName;

    const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
      resource_type: "raw",
      filename_override: completeFileName,
      folder: "book-pdfs",
      format: "pdf",
    });

    completeFileName = uploadResultPdf.secure_url;
    await fs.promises.unlink(bookFilePath);
  }

  const updatedBook = await bookModel.findOneAndUpdate(
    {
      _id: bookId,
    },
    {
      title: title,
      genre: genre,
      coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
      file: completeFileName ? completeFileName : book.file,
    },
    { new: true }
  );

  res.json(updatedBook);
};

export { createBook, updateBook };
