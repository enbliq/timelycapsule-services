import { Response } from "express";

interface ErrorDetail {
  message: string;
  field?: string;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: T
) => {
  return res.status(statusCode).json({
    success,
    message,
    data: data || null
  });
};

export const sendSuccessResponse = <T>(
  res: Response,
  message: string = "Success",
  data?: T,
  statusCode: number = 200
) => {
  return sendResponse(res, statusCode, true, message, data);
};

export const sendErrorResponse = (
  res: Response,
  message: string = "Error occurred",
  statusCode: number = 500,
  errors: ErrorDetail[] = []
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    data: null
  });
};
