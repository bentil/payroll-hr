import { fileUpload } from '../utils/helpers';
import Excel from 'exceljs';
import { InputError } from '../errors/http-errors';
import { NextFunction, Request, Response } from 'express';

export default function validate(sheetName: string) {
  return async function (req:Request, res: Response, next: NextFunction) {
    try {
      const request = await fileUpload(req, 'file') as Express.Request;
      const file = request.file as Express.Multer.File;

      if (!file) {
        throw new InputError({
          message: 'No file uploaded'
        });
      }

      if (['xls', 'xlsx', 'csv'].indexOf(
        file.originalname.split('.')[file.originalname.split('.').length-1]
      ) === -1) {
        throw new InputError({
          message: 'Wrong file extention'
        });
      }

      const workbook = new Excel.Workbook();
      const sheet = await workbook.xlsx.load(file.buffer as any);
      const worksheet = sheet.getWorksheet(sheetName);
      if (worksheet == null) {
        throw new InputError({
          message: 'File is invalid. Kindly download template and try again'
        });
      }
    } catch (err) {
      next(err);
    }
    return next();
  };
}