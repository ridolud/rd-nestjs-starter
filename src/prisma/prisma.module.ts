import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { APP_FILTER } from '@nestjs/core';
import { PrismaExceptionFilter } from 'src/prisma/exception-filters/prisma.exception-filters';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
