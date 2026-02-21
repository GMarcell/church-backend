/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const jwtExtractor = ExtractJwt.fromAuthHeaderAsBearerToken();

    const options: StrategyOptions = {
      jwtFromRequest: jwtExtractor,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'supersecret',
    };

    super(options);
  }

  validate(payload: any) {
    return payload;
  }
}
