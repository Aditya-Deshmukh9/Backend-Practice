import { NextFunction, Request, Response, raw } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import bookModel from "./bookModel";
import fs from "node:fs";
import createHttpError from "http-errors";
import { AuthRequest } from "../middleware/authinticate";
import { Book } from "./booktypes";

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

const listBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1; // Default page number is 1
    const limit = parseInt(req.query.limit as string) || 10; // Default limit is 10 items per page

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Query the database with pagination
    const books: Book[] = await bookModel.find().skip(skip).limit(limit);

    // Count total number of documents
    const totalBooks: number = await bookModel.countDocuments();

    // Calculate total pages
    const totalPages: number = Math.ceil(totalBooks / limit);

    // Return response with paginated data
    res.json({
      books,
      totalPages,
      currentPage: page,
      totalBooks,
    });
  } catch (err) {
    return next(createHttpError(500, "Error while getting books"));
  }
};

const getSingleBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const bookId = req.params.bookId;

  try {
    const book = await bookModel.findOne({ _id: bookId });
    if (!book) {
      return next(createHttpError(404, "Book not found."));
    }
    res.status(201).json({ book, res: "Book Delete Successfully" });
  } catch (err) {
    return next(createHttpError(500, "Error while getting a book"));
  }
};

const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.bookId;

  const book = await bookModel.findOne({ _id: bookId });
  if (!book) {
    return next(createHttpError(404, "Book not found"));
  }

  // Check Access
  const _req = req as AuthRequest;
  if (book.author.toString() !== _req.userId) {
    return next(createHttpError(403, "You can not update others book."));
  }

  const coverFileSplits = book.coverImage.split("/");
  const coverImagePublicId =
    coverFileSplits.at(-2) + "/" + coverFileSplits.at(-1)?.split(".").at(-2);

  const bookFileSplits = book.file.split("/");
  const bookFilePublicId = bookFileSplits.at(-2) + "/" + bookFileSplits.at(-1);
  console.log("bookFilePublicId", bookFilePublicId);
  // todo: add try error block
  await cloudinary.uploader.destroy(coverImagePublicId);
  await cloudinary.uploader.destroy(bookFilePublicId, {
    resource_type: "raw",
  });

  await bookModel.deleteOne({ _id: bookId });

  res.status(201).json({ res: "Book Delete Successfully" });
};

export { createBook, updateBook, listBooks, getSingleBook, deleteBook };
