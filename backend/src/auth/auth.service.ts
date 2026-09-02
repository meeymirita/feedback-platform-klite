import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { UserService } from '@/user/user.service';
import { User } from '@/generated/prisma/client';
import { LoginDto } from '@/auth/dto/login.dto';
import { verify } from 'argon2';
import { ConfigService } from '@nestjs/config';
import { parseBoolean } from '@/libs/common/utils/parse-boolean.util';

@Injectable()
export class AuthService {
  public constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService
  ) {}
  public async register(req: Request, dto: RegisterDto) {
    const isExists = await this.userService.findByEmail(dto.email);
    if (isExists) {
      throw new ConflictException(
        'Регистрация не удалась. Пользователь с таким email уже существует',
      );
    }

    const newUser = await this.userService.create(
      dto.email,
      dto.password,
      dto.name,
    );

    return this.saveSession(req, newUser);
  }
  public async login(req: Request, dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user || !(await verify(user.password, dto.password))) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const { password: _password, ...safeUser } = user;
    return this.saveSession(req, safeUser);
  }
  public async logout(req: Request, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          return reject(
            new InternalServerErrorException(
              'Не удалось завершить сессию. Возможно, возникла проблема с сервером или сессия уже была завершена',
            ),
          );
        }
        // Браузер удаляет куку, только если у очищающего Set-Cookie совпадают
        // name + domain + path с теми, что были при установке (см. main.ts).
        res.clearCookie(this.configService.getOrThrow<string>('SESSION_NAME'), {
          domain:
            this.configService.get<string>('SESSION_DOMAIN') || undefined,
          path: '/',
          httpOnly: parseBoolean(
            this.configService.getOrThrow<string>('SESSION_HTTP_ONLY'),
          ),
          secure: parseBoolean(
            this.configService.getOrThrow<string>('SESSION_SECURE'),
          ),
          sameSite: 'lax',
        });
        resolve();
      });
    });
  }
  private saveSession(req: Request, user: Omit<User, 'password'>) {
    return new Promise((resolve, reject) => {
      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) {
          return reject(
            new InternalServerErrorException('Не удалось сохранить сессию'),
          );
        }
        resolve({ user });
      });
    });
  }
}
// https://www.youtube.com/watch?v=O5Qry8cBhG4&t=303s
//     https://github.com/TeaCoder52/nestjs-full-authorization/blob/main/src/user/user.service.ts
