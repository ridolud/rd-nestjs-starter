import { Response } from 'express';

class ResponseMock {
  public cookie = jest.fn().mockReturnThis();
  public clearCookie = jest.fn().mockReturnThis();
  public status = jest.fn().mockReturnThis();
  public json = jest.fn().mockReturnThis();
  public send = jest.fn().mockReturnThis();
  public header = jest.fn().mockReturnThis();
}

export const createResponseMock = (): Response =>
  new ResponseMock() as unknown as Response;
