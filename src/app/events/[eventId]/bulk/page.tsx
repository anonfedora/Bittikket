"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BulkTicketCreation } from "@/components/bulk/BulkTicketCreation";
import { BulkCheckIn } from "@/components/bulk/BulkCheckIn";
import { BulkTransfer } from "@/components/bulk/BulkTransfer";
import { BulkNotifications } from "@/components/bulk/BulkNotifications";

interface BulkOperationsPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default function BulkOperationsPage({ params }: BulkOperationsPageProps) {
  const { eventId } = React.use(params);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Bulk Operations</h1>
      
      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">Create Tickets</TabsTrigger>
          <TabsTrigger value="check-in">Check-in</TabsTrigger>
          <TabsTrigger value="transfer">Transfer</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Bulk Ticket Creation</h2>
            <BulkTicketCreation eventId={eventId} />
          </div>
        </TabsContent>

        <TabsContent value="check-in">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Bulk Check-in</h2>
            <BulkCheckIn eventId={eventId} />
          </div>
        </TabsContent>

        <TabsContent value="transfer">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Bulk Transfer</h2>
            <BulkTransfer eventId={eventId} />
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Bulk Notifications</h2>
            <BulkNotifications eventId={eventId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 