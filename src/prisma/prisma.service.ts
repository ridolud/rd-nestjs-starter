import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async onModuleInit() {
    if (!this.configService.get('testing')) await this.$connect();
  }

  async onModuleDestroy() {
    if (!this.configService.get('testing')) await this.$disconnect();
  }
}
