import { IEmailPayload } from 'src/jwt/interfaces/email-token.interface';
import { IToken } from 'src/jwt/interfaces/token.interface';

export interface IRefreshPayload extends IEmailPayload {
  tokenId: string;
}

export interface IRefreshToken extends IRefreshPayload, IToken {}
