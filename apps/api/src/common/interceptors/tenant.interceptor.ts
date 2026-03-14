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

    const battalionId = request.user?.battalion_id
    if (!battalionId) throw new UnauthorizedException('Missing battalion context')

    request.battalionId = battalionId
    // Support company soldiers get battalion_scope=true → companyId is null so queries span
    // the whole battalion. Combat soldiers are scoped to their own company.
    request.companyId = request.user.battalion_scope ? null : request.user.company_id
    return next.handle()
  }
}
