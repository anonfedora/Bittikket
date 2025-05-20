"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Calendar, Ticket, Users } from "lucide-react";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  ticketPrice: number;
  ticketCount: number;
  ticketsSold: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Events</h1>
        <p className="text-muted-foreground mt-2">
          Browse and manage your events
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <p className="text-muted-foreground">{event.description}</p>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(new Date(event.date), "PPP p")}
                </div>
                <div className="flex items-center text-sm">
                  <Ticket className="h-4 w-4 mr-2" />
                  {event.ticketPrice} sats
                </div>
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 mr-2" />
                  {event.ticketsSold} / {event.ticketCount} tickets sold
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button
                className="w-full"
                onClick={() => window.location.href = `/events/${event.id}`}
              >
                View Details
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = `/events/${event.id}/verify`}
              >
                Verify Tickets
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 