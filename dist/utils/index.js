"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.ApiResponse = exports.ApiError = void 0;
/**
 * Custom class for throw error in api controller.
 *
 * @class ApiError
 */
class ApiError extends Error {
    /**
     * @constructor for invoke class ApiError.
     * @param {number} code - Error code.
     * @param {string} message - Error message.
     */
    constructor(code, message, stack = "") {
        super(message);
        this.code = code;
        this.message = message;
        this.stack = stack;
    }
}
exports.ApiError = ApiError;
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
const ApiResponse = (_req, res, code, message, data = null, errors = null) => {
    const success = code < 400 ? true : false;
    const response = { code, success, message };
    if (data)
        response.data = data;
    if (errors)
        response.errors = errors;
    return res.status(code).send(Object.assign({}, response));
};
exports.ApiResponse = ApiResponse;
/**
 * Custom handler function for parse zod errors.
 *
 * @param {ZodError} error
 * @returns {object[]} Return parsed zod errors object[].
 */
const ValidationError = (error) => {
    return error.errors.map((err) => ({
        path: err.path.join(", "),
        message: err.message,
    }));
};
exports.ValidationError = ValidationError;
