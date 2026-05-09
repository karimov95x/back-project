import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { setupSwagger } from "./utils/swagger.util";

function getAllowedOrigins() {
  const configuredOrigins = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);

  console.log(
    "[CORS] env CORS_ORIGIN:",
    JSON.stringify(process.env.CORS_ORIGIN),
  );
  console.log("[CORS] allowedOrigins:", configuredOrigins);

  return configuredOrigins.length > 0
    ? configuredOrigins
    : ["http://localhost:3001", "http://localhost:3000"];
}

export async function createApp() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = getAllowedOrigins();

  app.use(cookieParser());

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });

  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  setupSwagger(app);

  return app;
}
