import { Request, Response } from "express";
import { ZodError } from "zod";

/**
 * Custom class for throw error in api controller.
 *
 * @class ApiError
 */
class ApiError extends Error {
  public code: number;
  public message: string;

  /**
   * @constructor for invoke class ApiError.
   * @param {number} code - Error code.
   * @param {string} message - Error message.
   */
  constructor(code: number, message: string, stack: string = "") {
    super(message);
    this.code = code;
    this.message = message;
    this.stack = stack;
  }
}

type ResponseType = {
  code: number;
  success: boolean;
  message: string;
  data?: any;
  errors?: any;
};

/**
 * Custom handler function for api response.
 *
 * @param {Request} _req Request.
 * @param {Response} res Response.
 * @param {number} code StatusCode.
 * @param {string} message Response message.
 * @param {any} data Response data.
 * @returns {JSON} Return api response in json format.
 */
const ApiResponse = (
  _req: Request,
  res: Response,
  code: number,
  message: string,
  data: any = null,
  errors: any = null
) => {
  const success: boolean = code < 400 ? true : false;
  const response: ResponseType = { code, success, message };

  if (data) response.data = data;
  if (errors) response.errors = errors;
  return res.status(code).send({ ...response });
};

/**
 * Custom handler function for parse zod errors.
 *
 * @param {ZodError} error
 * @returns {object[]} Return parsed zod errors object[].
 */
const ValidationError = (error: ZodError): object[] => {
  return error.errors.map((err) => ({
    path: err.path.join(", "),
    message: err.message,
  }));
};

export { ApiError, ApiResponse, ValidationError };
