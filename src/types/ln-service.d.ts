declare module 'ln-service' {
  export interface LndConfig {
    socket: string;
    macaroon: string;
    cert: string;
  }

  export interface Invoice {
    request: string;
    id: string;
    secret: string;
    tokens: number;
    description: string;
    expires_at: string;
    is_confirmed: boolean;
  }

  export function createAuthenticatedLndGrpc(config: LndConfig): { lnd: any };
  export function createInvoice(params: { lnd: any; tokens: number; description: string }): Promise<Invoice>;
  export function getInvoice(params: { lnd: any; id: string }): Promise<Invoice>;
} 