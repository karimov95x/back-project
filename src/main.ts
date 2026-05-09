import "dotenv/config";
import { createApp } from "./app.factory";

async function bootstrap() {
  const app = await createApp();
  const port = Number(process.env.PORT ?? 3002);

  await app.listen(port, "0.0.0.0");
}

void bootstrap();
