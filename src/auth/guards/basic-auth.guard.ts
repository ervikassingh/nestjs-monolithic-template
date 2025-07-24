import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BasicAuthGuard implements CanActivate {
    constructor(private configService: ConfigService) {}
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Basic ')) {
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }

        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');

        if (this.validateCredentials(username, password)) {
            return true;
        } else {
            throw new UnauthorizedException('Invalid username or password');
        }
    }

    private validateCredentials(username: string, password: string): boolean {
        const validUsername = this.configService.get<string>('BASIC_AUTH_USERNAME');
        const validPassword = this.configService.get<string>('BASIC_AUTH_PASSWORD');
        return username === validUsername && password === validPassword;
    }
}