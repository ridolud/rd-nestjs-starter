export interface IResponse<T> {
  statusCode: number;
  message: string | string[];
  error?: string;
  data?: T;
}
