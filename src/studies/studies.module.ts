import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { StudiesController } from "./studies.controller";
import { StudiesService } from "./studies.service";

@Module({
  imports: [PrismaModule],
  controllers: [StudiesController],
  providers: [StudiesService],
  exports: [StudiesService],
})
export class StudiesModule {}
