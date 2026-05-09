import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Public } from "./auth/decorators/public.decorator";
import { AppService } from "./app.service";

@ApiTags("App")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get("health")
  @ApiOperation({ summary: "Проверка состояния API" })
  @ApiResponse({ status: 200, description: "API доступно" })
  getHealth() {
    return this.appService.getHealth();
  }
}
