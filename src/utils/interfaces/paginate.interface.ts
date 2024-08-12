export interface IPaginate<T = any> {
  total: number;
  records: T[];
}
