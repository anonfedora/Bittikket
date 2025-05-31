import { NextRequest } from "next/server";
import db from "@/lib/db";
import { Event } from "@/types/event";

interface TicketMetrics {
  totalTickets: number;
  ticketsSold: number;
  checkInRate: number;
  revenue: number;
  salesByDate: Array<{ date: string; count: number; revenue: number }>;
  checkInsByDate: Array<{ date: string; count: number }>;
  categoryDistribution: Array<{ category: string; count: number }>;
}

interface CheckInStats {
  totalCheckedIn: number;
  checkedIn: number;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
): Promise<Response> {
  try {
    const { eventId } = await context.params;

    // Get event details
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as Event | undefined;
    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    // Get total tickets and tickets sold
    const totalTickets = event.ticketCount;
    const ticketsSold = event.ticketsSold;

    // Get check-in statistics
    const checkInStats = db.prepare(`
      SELECT 
        COUNT(*) as totalCheckedIn,
        COUNT(CASE WHEN status = 'used' THEN 1 END) as checkedIn
      FROM tickets 
      WHERE eventId = ? AND invoiceStatus = 'paid'
    `).get(eventId) as CheckInStats;

    // Calculate check-in rate
    const checkInRate = checkInStats.totalCheckedIn > 0 
      ? (checkInStats.checkedIn / checkInStats.totalCheckedIn) * 100 
      : 0;

    // Get sales by date
    const salesByDate = db.prepare(`
      SELECT 
        date(createdAt) as date,
        COUNT(*) as count,
        SUM(CASE WHEN invoiceStatus = 'paid' THEN 1 ELSE 0 END) * ? as revenue
      FROM tickets 
      WHERE eventId = ?
      GROUP BY date(createdAt)
      ORDER BY date
    `).all(event.ticketPrice, eventId) as Array<{ date: string; count: number; revenue: number }>;

    // Get check-ins by date
    const checkInsByDate = db.prepare(`
      SELECT 
        date(checkedInAt) as date,
        COUNT(*) as count
      FROM tickets 
      WHERE eventId = ? AND status = 'used'
      GROUP BY date(checkedInAt)
      ORDER BY date
    `).all(eventId) as Array<{ date: string; count: number }>;

    // Get category distribution
    const categoryDistribution = db.prepare(`
      SELECT 
        COALESCE(category, 'Uncategorized') as category,
        COUNT(*) as count
      FROM tickets 
      WHERE eventId = ? AND invoiceStatus = 'paid'
      GROUP BY category
    `).all(eventId) as Array<{ category: string; count: number }>;

    // Calculate total revenue
    const revenue = db.prepare(`
      SELECT COUNT(*) * ? as total
      FROM tickets 
      WHERE eventId = ? AND invoiceStatus = 'paid'
    `).get(event.ticketPrice, eventId) as { total: number };

    const metrics: TicketMetrics = {
      totalTickets,
      ticketsSold,
      checkInRate,
      revenue: revenue.total,
      salesByDate,
      checkInsByDate,
      categoryDistribution
    };

    return Response.json(metrics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return Response.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
} 