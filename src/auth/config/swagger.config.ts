import { DocumentBuilder } from "@nestjs/swagger";

export function getSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle("Radiomed API")
    .setDescription(
      "REST API для обмена медицинскими исследованиями между клиниками и врачами.",
    )
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      "bearer",
    )
    .build();
}
