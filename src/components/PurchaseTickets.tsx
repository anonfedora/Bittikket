import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface PurchaseTicketsProps {
  eventId: string;
  ticketPrice: number;
  maxTickets: number;
  onPurchaseComplete: () => void;
}

export default function PurchaseTickets({ eventId, ticketPrice, maxTickets, onPurchaseComplete }: PurchaseTicketsProps) {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<{
    request: string;
    amount: number;
    description: string;
    expires_at: string;
    id: string;
  } | null>(null);

  // Poll for payment status
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (invoice) {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/events/${eventId}/tickets/check-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ invoiceId: invoice.id }),
          });

          const data = await response.json();

          if (data.status === 'paid') {
            clearInterval(intervalId);
            setInvoice(null);
            onPurchaseComplete();
          } else if (data.status === 'expired') {
            clearInterval(intervalId);
            setInvoice(null);
            setError('Payment expired. Please try again.');
          }
        } catch (err) {
          console.error('Error checking payment status:', err);
        }
      }, 5000); // Check every 5 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [invoice, eventId, onPurchaseComplete]);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setInvoice(null);

    if (quantity > maxTickets) {
      setError(`Maximum ${maxTickets} tickets can be purchased`);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to purchase tickets');
      }

      setInvoice(data.invoice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePurchase} className="space-y-4">
          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium text-gray-700"
            >
              Number of Tickets
            </label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={maxTickets}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              placeholder="Enter quantity"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Total: {quantity * ticketPrice} sats
            </p>
            <p className="text-xs text-gray-500">
              Maximum {maxTickets} tickets available
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Purchase Tickets"
            )}
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {invoice && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Payment Required</h3>
            <div className="flex flex-col items-center space-y-4">
              <QRCodeSVG
                value={invoice.request}
                size={256}
                className="p-2 bg-white rounded"
              />
              <p className="text-sm text-gray-600">
                Scan with your Lightning wallet to pay {invoice.amount} sats
              </p>
              <p className="text-xs text-gray-500">
                Invoice expires at: {new Date(invoice.expires_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 