import { useState, useEffect } from 'react';
import { Ticket } from '@/types/event';
import { QRCodeSVG } from 'qrcode.react';
import { useRouter } from 'next/navigation';

interface TicketDetailsProps {
  ticket: Ticket;
  eventId: string;
}

export default function TicketDetails({ ticket, eventId }: TicketDetailsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const checkPaymentStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `/api/events/${eventId}/tickets/${ticket.id}/check-payment`
      );
      const data = await response.json();

      if (data.status === "paid") {
        router.refresh();
      }
    } catch (err) {
      setError("Failed to check payment status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="space-y-6">
        {/* Ticket Header */}
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Ticket Details</h2>
          <p className="text-sm text-gray-500">ID: {ticket.id}</p>
        </div>

        {/* Ticket Status */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-500">Status</span>
            <p className="mt-1 text-lg font-semibold">
              {ticket.status === "pending" ? (
                <span className="text-yellow-600">Pending Payment</span>
              ) : ticket.status === "valid" ? (
                <span className="text-green-600">Valid</span>
              ) : (
                <span className="text-red-600">Used</span>
              )}
            </p>
          </div>
          {ticket.status === "pending" && (
            <button
              onClick={checkPaymentStatus}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Checking..." : "Check Payment"}
            </button>
          )}
        </div>

        {/* Payment Information */}
        {ticket.status === "pending" && ticket.invoiceRequest && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Payment Required</h3>
            <div className="flex flex-col items-center space-y-4">
              <QRCodeSVG
                value={ticket.invoiceRequest}
                size={256}
                className="p-2 bg-white rounded"
              />
              <p className="text-sm text-gray-600">
                Scan with your Lightning wallet to pay
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Creation Date */}
        <div className="border-t pt-4">
          <span className="text-sm font-medium text-gray-500">Created</span>
          <p className="mt-1">
            {new Date(ticket.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
} 