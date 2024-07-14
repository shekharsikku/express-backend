import mongodb from "./database";
import env from "./utils/env";
import app from "./app";

const uri = env.DATABASE_URL;
const port = env.PORT;

(async () => {
  try {
    const state = await mongodb(uri);
    if (state == 1) {
      app.listen(port, () => {
        console.log(`Running at: http://localhost:${port}\n`);
      });
    } else {
      throw new Error("Invalid connection state!");
    }
  } catch (error: any) {
    console.log(`Error: ${error.message}\n`);
    process.exit(1);
  }
})();
