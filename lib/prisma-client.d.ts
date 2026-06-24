declare class PrismaClient<ClientOptions extends object = {}> {
  constructor(options?: { adapter?: any });
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $on(event: string, callback: (e: any) => void): void;
  $transaction<P extends Promise<any>[]>(queries: P): Promise<any>;
  $queryRaw<T = any>(query: any): Promise<T>;
  $executeRaw(query: any): Promise<number>;
  user: any;
  book: any;
  bookImage: any;
  transaction: any;
  fine: any;
  commission: any;
  payment: any;
}
export { PrismaClient };