export interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  ticketPrice: number;
  ticketCount: number;
  ticketsSold: number;
}

export interface Ticket {
  id: string;
  eventId: string;
  status: 'pending' | 'valid' | 'used';
  createdAt: string;
  invoiceId?: string;
  invoiceRequest?: string;
  invoiceStatus?: 'pending' | 'paid' | 'expired';
  ownerAddress: string;
  transferHistory: TicketTransfer[];
}

export interface TicketTransfer {
  from: string;
  to: string;
  timestamp: string;
}

export interface CreateEventRequest {
  name: string;
  description: string;
  date: string;
  location: string;
  ticketPrice: number;
  totalTickets: number;
}

export interface PurchaseTicketRequest {
  eventId: string;
  quantity: number;
  buyerAddress: string;
} 