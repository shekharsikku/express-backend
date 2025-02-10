import express, {
  NextFunction,
  Request,
  Response,
  ErrorRequestHandler,
} from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import env from "./utils/env";
import routers from "./routers";

const app = express();

app.use(
  express.json({
    limit: env.PAYLOAD_LIMIT,
    strict: true,
  })
);

app.use(
  express.urlencoded({
    limit: env.PAYLOAD_LIMIT,
    extended: true,
  })
);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(compression());
app.use(cookieParser(env.COOKIES_SECRET));
app.use("/public/temp", express.static(path.join(__dirname, "../public/temp")));

/** Morgan logging middleware */
if (env.isDev) {
  app.use(morgan("dev"));
} else {
  app.use(morgan("tiny"));
}

/** Api router middleware */
app.use("/api", routers);

app.get("*path", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Welcome to the Synchronous Backend!" });
});

import { ApiError, ApiResponse } from "./utils";

app.use(((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`Error: ${err.message}`);

  let error = new ApiError(500, "Internal Server Error!");

  /* Mongoose Bad ObjectId */
  if (err.name === "CastError") {
    error = new ApiError(404, "Resource Not Found!");
  }

  /* Mongoose Duplicate Key */
  if (err.code === 11000) {
    error = new ApiError(400, "Duplicate Field Value Entered!");
  }

  /* Mongoose Validation Error */
  if (err.name === "ValidationError" && err.errors) {
    const message = Object.values(err.errors).map((val: any) => val.message);
    error = new ApiError(400, message.join(", "));
  }

  return ApiResponse(res, error.code, error.message);
}) as ErrorRequestHandler);

export default app;
