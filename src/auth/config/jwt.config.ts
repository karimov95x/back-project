import type { ConfigService } from "@nestjs/config";
import type { SignOptions } from "jsonwebtoken";

export function jwtConfig(configService: ConfigService) {
  return {
    secret: configService.getOrThrow<string>("JWT_SECRET"),
    signOptions: {
      expiresIn: (configService.get<string>("JWT_EXPIRES_IN") ??
        "7d") as SignOptions["expiresIn"],
    },
  };
}
