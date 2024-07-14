import app from "./app";

const port = 4000;

(async () => {
  try {
    app.listen(port, () => {
      console.log(`Running at: http://localhost:${port}\n`);
    });
  } catch (error: any) {
    console.log(`Error: ${error.message}\n`);
    process.exit(1);
  }
})();
