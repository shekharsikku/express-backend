import connectMongo from "connect-mongodb-session";
import session from "express-session";
import cors from "cors";
import env from "../utils/env";

const MongoDBStore = connectMongo(session);

const store = new MongoDBStore({
  uri: env.DATABASE_URL,
  collection: "sessions",
});

store.on("error", (error: any) => console.log(error.message));

const expressSession = session({
  name: "session",
  secret: env.SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
  unset: "destroy",
  cookie: {
    maxAge: parseInt(env.SESSION_EXPIRY),
    httpOnly: true,
    sameSite: "none", // none only for development purpose
    secure: env.NODE_ENV !== "development",
  },
  rolling: true,
  store: store,
});

const corsOrigin = cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
});

export { expressSession, corsOrigin };
