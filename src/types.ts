// Frontend types
export interface FrontendInvoice {
  paymentRequest: string;
  amount: number;
  memo: string;
  expiry: number;
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
}
