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
import env from "./utils/env";

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

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// import UserRouter from "./router/user";
// app.use("/api/user", UserRouter);

app.get("/", (_req: Request, res: Response) => {
  return res.status(200).send({ message: "Hello, from express on vercel! " });
});

app.use(((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`Error: ${err.message}`);
  res.status(500).json({ message: "Internal server error!" });
}) as ErrorRequestHandler);

export default app;
