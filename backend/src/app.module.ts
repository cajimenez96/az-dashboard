import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { BudgetsModule } from './budgets/budgets.module';
import { FinancialModule } from './financial/financial.module';
import { SystemsModule } from './systems/systems.module';
import { TasksModule } from './tasks/tasks.module';
import { KanbanModule } from './kanban/kanban.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    BudgetsModule,
    FinancialModule,
    SystemsModule,
    TasksModule,
    KanbanModule,
    ActivityLogModule,
  ],
  providers: [
    // Order matters: JWT runs first, then Roles
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
