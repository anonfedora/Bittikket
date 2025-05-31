"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Calendar, Ticket } from "lucide-react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Event, Ticket as TicketType } from '@/types/event';
import TicketDetails from '@/components/TicketDetails';

export default function TicketDetailsPage({
  params,
}: {
  params: Promise<{ eventId: string; ticketNumber: string }>;
}) {
  const { eventId, ticketNumber } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [ticket, setTicket] = useState<TicketType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [eventResponse, ticketResponse] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch(`/api/events/${eventId}/tickets/${ticketNumber}`),
        ]);

        if (!eventResponse.ok) {
          throw new Error('Failed to fetch event');
        }
        const eventData = await eventResponse.json();
        setEvent(eventData);

        if (!ticketResponse.ok) {
          throw new Error('Failed to fetch ticket');
        }
        const ticketData = await ticketResponse.json();
        setTicket(ticketData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [eventId, ticketNumber]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error || !event || !ticket) {
    return <div>Error: {error || 'Event or ticket not found'}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
          <p className="text-gray-600">{event.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Ticket Details</h2>
            <TicketDetails
              ticket={ticket}
              eventId={eventId}
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.href = `/events/${eventId}`}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Event
          </button>
        </div>
      </div>
    </div>
  );
} 