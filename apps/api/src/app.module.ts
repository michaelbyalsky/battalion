import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { SoldiersModule } from './soldiers/soldiers.module'
import { TenantInterceptor } from './common/interceptors/tenant.interceptor'
import { APP_INTERCEPTOR } from '@nestjs/core'

@Module({
  imports: [AuthModule, SoldiersModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
