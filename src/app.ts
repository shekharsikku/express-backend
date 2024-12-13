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
import ApiRouters from "./routers";

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
app.use("/api", ApiRouters);

app.all("*path", (_req: Request, res: Response) => {
  res.status(200).send({ message: "Hello, from Express via Vercel!" });
});

app.use(((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`Error: ${err.message}`);
  res.status(500).json({ message: "Internal server error!" });
}) as ErrorRequestHandler);

export default app;
