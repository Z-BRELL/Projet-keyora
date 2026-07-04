import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected generateKey(
    context: ExecutionContext,
    suffix: string,
    name: string,
  ): string {
    // Use IP address and user ID if authenticated
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const ip = request.ip;
    
    if (userId) {
      return `${name}:${userId}:${suffix}`;
    }
    return `${name}:${ip}:${suffix}`;
  }
}
