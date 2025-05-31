"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { QRCodeSVG } from "qrcode.react";

interface BulkTicketCreationProps {
  eventId: string;
}

export function BulkTicketCreation({ eventId }: BulkTicketCreationProps) {
  const [quantity, setQuantity] = React.useState(1);
  const [category, setCategory] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [seatNumbers, setSeatNumbers] = React.useState<string[]>([]);
  const [invoiceRequest, setInvoiceRequest] = React.useState<string | null>(null);
  const [totalAmount, setTotalAmount] = React.useState<number | null>(null);
  const [creationSuccess, setCreationSuccess] = React.useState(false);
  const [paymentStatus, setPaymentStatus] = React.useState<'pending' | 'paid' | 'failed'>('pending');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setInvoiceRequest(null);
    setTotalAmount(null);
    setCreationSuccess(false);
    setPaymentStatus('pending');

    try {
      const response = await fetch(`/api/events/${eventId}/tickets/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity,
          category: category || undefined,
          seatNumbers: seatNumbers.length > 0 ? seatNumbers : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create tickets");
      }

      setInvoiceRequest(data.invoice);
      setTotalAmount(data.totalAmount);
      setCreationSuccess(true);
      toast.success(`Created ${quantity} tickets successfully. Please pay the invoice.`);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleSeatNumbersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const numbers = e.target.value.split("\n").filter(Boolean);
    setSeatNumbers(numbers);
  };

  const resetForm = () => {
    setQuantity(1);
    setCategory("");
    setSeatNumbers([]);
    setInvoiceRequest(null);
    setTotalAmount(null);
    setCreationSuccess(false);
    setPaymentStatus('pending');
  };

  if (creationSuccess && invoiceRequest && totalAmount !== null) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Pay for Tickets</h2>
        <p>Tickets created successfully. Please pay the invoice to validate them.</p>
        
        <div className="flex flex-col items-center space-y-4">
          <p className="text-lg font-medium">Amount: {totalAmount} sats</p>
          <div className="p-4 border rounded-md">
            <QRCodeSVG value={invoiceRequest} size={256} level="H" />
          </div>
          <p className="text-sm text-gray-600 break-all">Invoice: {invoiceRequest}</p>
          <p>Payment Status: {paymentStatus}</p>
        </div>

        <Button onClick={resetForm}>Create More Tickets</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quantity">Number of Tickets</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setQuantity(isNaN(value) ? 1 : value);
          }}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category (Optional)</Label>
        <Input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g., VIP, General Admission"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="seatNumbers">Seat Numbers (Optional)</Label>
        <Textarea
          id="seatNumbers"
          className="w-full min-h-[100px] p-2 border rounded-md"
          value={seatNumbers.join("\n")}
          onChange={handleSeatNumbersChange}
          placeholder="Enter seat numbers, one per line"
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Tickets"}
      </Button>
    </form>
  );
} 