import { lndClient } from './lnd';
import { LndInvoice } from '@/types/lnd';

interface LightningInvoiceResponse {
  id: string;
  request: string;
  description: string;
  expires_at: string;
  is_confirmed: boolean;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function retry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

export async function generateInvoice(amount: number, description: string) {
  try {
    const invoice = await retry(async () => {
      const result = await lndClient.createInvoice(amount, description);
      return {
        id: result.r_hash.toString('hex'),
        request: result.payment_request,
        description: description, // Use the input description since memo is not in LndInvoice
        expires_at: new Date(Date.now() + 3600000).toISOString(), // Default 1 hour expiry
        is_confirmed: result.settled || false
      };
    });

    return {
      id: invoice.id,
      request: invoice.request,
      description: invoice.description,
      expires_at: invoice.expires_at
    };
  } catch (error) {
    console.error('Error generating invoice:', error);
    if (error instanceof Error) {
      if (error.message.includes('network')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      if (error.message.includes('authentication')) {
        throw new Error('Authentication error. Please check your LND credentials.');
      }
    }
    throw new Error('Failed to generate invoice. Please try again later.');
  }
}

export async function checkInvoiceStatus(invoiceId: string) {
  try {
    const invoice = await retry(async () => {
      const result = await lndClient.checkInvoiceStatus(Buffer.from(invoiceId, 'hex'));
      return {
        id: result.r_hash.toString('hex'),
        request: result.payment_request,
        description: '', // Description not available in lookup response
        expires_at: new Date(Date.now() + 3600000).toISOString(), // Default 1 hour expiry
        is_confirmed: result.settled || false
      };
    });

    // Check if invoice has expired
    const expiresAt = new Date(invoice.expires_at);
    if (expiresAt < new Date()) {
      return {
        paid: false,
        status: 'expired',
      };
    }

    return {
      paid: invoice.is_confirmed,
      status: invoice.is_confirmed ? 'paid' : 'pending',
    };
  } catch (error) {
    console.error('Error checking invoice status:', error);
    if (error instanceof Error) {
      if (error.message.includes('network')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      if (error.message.includes('not found')) {
        throw new Error('Invoice not found. It may have expired.');
      }
    }
    throw new Error('Failed to check invoice status. Please try again later.');
  }
} 