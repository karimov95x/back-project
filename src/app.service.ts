import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealth() {
    return {
      name: "Radiomed API",
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }
}
