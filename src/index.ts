import { mongodb } from "./database";
import env from "./utils/env";
import app from "./app";

const uri = env.MONGODB_URI;
const port = env.PORT;

(async () => {
  try {
    const state = await mongodb(uri);
    if (state === 1) {
      console.log("Database connection success!");
      app.listen(port, () => {
        console.log(`Server running on port: ${port}\n`);
      });
    } else {
      throw new Error("Database connection error!");
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}\n`);
    process.exit(1);
  }
})();
