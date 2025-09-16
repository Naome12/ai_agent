import app from "./app";
import { env } from "./config/env";
import logger from "./utils/logger";

app.listen(env.port, () => {
  console.log(`API running on: http://localhost:${env.port}`);
  logger.info({ msg: `API running on :${env.port}` });
});