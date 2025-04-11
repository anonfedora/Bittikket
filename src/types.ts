// Frontend types
export interface FrontendInvoice {
  paymentRequest: string;
  amount: number;
  memo: string;
  expiry: number;
  rHash: string; // hex string of the r_hash buffer
  paymentAddr: string; // hex string of the payment_addr buffer
  isPaid?: boolean;
}

// Backend request types
export interface InvoiceRequest {
  amount: number;
  memo: string;
  expiry?: number;
}

// LND API response types
export interface LndInvoice {
  r_hash: Buffer;
  payment_request: string;
  add_index: string;
  payment_addr: Buffer;
  settled?: boolean;
  state?: 'OPEN' | 'SETTLED' | 'CANCELED' | 'ACCEPTED';
  settle_date?: string;
  creation_date?: string;
  value?: string;
}

// Payment status response
export interface PaymentStatus {
  isPaid: boolean;
}
