"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { Event, Ticket } from "@/types/event";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, Ticket as TicketIcon, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import PurchaseTickets from "@/components/PurchaseTickets";
import { Input } from "@/components/ui/input";

export default function EventDetailsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [invoiceInput, setInvoiceInput] = useState("");
  const [decodeStatus, setDecodeStatus] = useState<null | { rHash: string; error?: string }>(null);
  const [polling, setPolling] = useState(false);
  const [paid, setPaid] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const fetchEventAndTickets = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch event');
      }
      const eventData = await response.json();
      setEvent(eventData);

      const ticketsResponse = await fetch(`/api/events/${eventId}/tickets`);
      if (!ticketsResponse.ok) {
        throw new Error('Failed to fetch tickets');
      }
      const ticketsData = await ticketsResponse.json();
      setTickets(ticketsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEventAndTickets();
  }, [eventId]);

  // Poll invoice status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (decodeStatus?.rHash && polling && !paid) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/invoice/${decodeStatus.rHash}/status`);
          const data = await res.json();
          if (data.isPaid) {
            setPaid(true);
            setPolling(false);
          }
        } catch (err) {
          setPollError("Failed to check invoice status");
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [decodeStatus, polling, paid]);

  // Claim ticket after payment
  useEffect(() => {
    const claimTicket = async () => {
      if (paid && decodeStatus?.rHash) {
        setClaiming(true);
        setClaimError(null);
        try {
          const res = await fetch(`/api/events/${eventId}/tickets/claim`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rHash: decodeStatus.rHash }),
          });
          if (!res.ok) {
            const data = await res.json();
            setClaimError(data.error || "Failed to claim ticket");
          } else {
            await fetchEventAndTickets();
          }
        } catch (err) {
          setClaimError("Failed to claim ticket");
        } finally {
          setClaiming(false);
        }
      }
    };
    claimTicket();
    // Only run when paid changes to true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid]);

  const handleDecodeInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setDecodeStatus(null);
    setPaid(false);
    setPollError(null);
    setPolling(false);
    try {
      const res = await fetch("/api/invoice/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentRequest: invoiceInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.rHash) {
        setDecodeStatus({ rHash: "", error: data.error || "Invalid invoice" });
        return;
      }
      setDecodeStatus({ rHash: data.rHash });
      setPolling(true);
    } catch (err) {
      setDecodeStatus({ rHash: "", error: "Failed to decode invoice" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            Error: {error || 'Event not found'}
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.href = '/events'}
          >
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const availableTickets = event.ticketCount - event.ticketsSold;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
          <p className="text-gray-600">{event.description}</p>
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {format(new Date(event.date), "PPP p")}
            </div>
            <div className="flex items-center">
              <TicketIcon className="h-4 w-4 mr-2" />
              {event.ticketPrice} sats
            </div>
            <div className="flex items-center">
              <span className="mr-2">Available:</span>
              {availableTickets} tickets
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <PurchaseTickets
              eventId={eventId}
              ticketPrice={event.ticketPrice}
              maxTickets={availableTickets}
              onPurchaseComplete={fetchEventAndTickets}
            />

            {/* Lightning Invoice Payment Section */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Pay for Ticket with Lightning Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDecodeInvoice} className="space-y-4">
                  <Input
                    value={invoiceInput}
                    onChange={e => setInvoiceInput(e.target.value)}
                    placeholder="Paste Lightning invoice (BOLT11) here"
                    required
                    disabled={polling || paid}
                  />
                  <Button type="submit" disabled={polling || paid} className="w-full">
                    {polling ? "Waiting for payment..." : paid ? "Paid" : "Submit Invoice"}
                  </Button>
                </form>
                {decodeStatus?.error && (
                  <div className="mt-2 text-red-600">{decodeStatus.error}</div>
                )}
                {pollError && (
                  <div className="mt-2 text-red-600">{pollError}</div>
                )}
                {paid && (
                  <div className="mt-4 flex flex-col items-start text-green-600">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-6 w-6 mr-2" />
                      Payment received! Your ticket will be issued shortly.
                    </div>
                    {claiming && (
                      <div className="mt-2 text-gray-600">Claiming your ticket...</div>
                    )}
                    {claimError && (
                      <div className="mt-2 text-red-600">{claimError}</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {isRefreshing ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : tickets.length > 0 ? (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">Ticket #{ticket.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-500">
                          Status: {ticket.status}
                        </p>
                      </div>
                      <Link
                        href={`/events/${eventId}/tickets/${ticket.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No tickets purchased yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/events'}
          >
            Back to Events
          </Button>
          <Link href={`/events/${eventId}/verify`}>
            <Button>Verify Ticket</Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 