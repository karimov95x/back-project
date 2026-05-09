import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Request } from "express";
import { AuthService } from "../auth.service";
import type { JwtPayload } from "../interfaces/jwt.interface";

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  if (typeof req.cookies?.accessToken === "string") {
    return req.cookies.accessToken;
  }

  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractToken]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_SECRET"),
    });
  }

  validate(payload: JwtPayload) {
    const validated = this.authService.validateUser(payload);

    if (!validated) {
      throw new UnauthorizedException("Пользователь не авторизован");
    }

    return validated;
  }
}
