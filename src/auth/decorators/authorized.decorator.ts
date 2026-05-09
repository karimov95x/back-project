import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { JwtPayload } from "../interfaces/jwt.interface";

export const Authorized = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
