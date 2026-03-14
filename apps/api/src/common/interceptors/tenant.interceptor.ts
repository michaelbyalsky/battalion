import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common'
import { Observable } from 'rxjs'

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest()

    // Skip public routes (no user attached yet)
    if (!request.user) return next.handle()

    const companyId = request.user?.company_id
    if (!companyId) throw new UnauthorizedException('Missing company context')

    request.companyId = companyId
    return next.handle()
  }
}
