declare module 'pg' {
  export interface PoolClient {
    query(text: string, params?: any[]): Promise<any>;
    release(err?: Error | boolean): void;
  }
  export class Pool {
    constructor(config?: any);
    connect(): Promise<PoolClient>;
    query(text: string, params?: any[]): Promise<any>;
    end(): Promise<void>;
    on(event: string, listener: (...args: any[]) => void): this;
  }
  export class Client {
    constructor(config?: any);
    connect(): Promise<void>;
    query(text: string, params?: any[]): Promise<any>;
    end(): Promise<void>;
  }
}
