import { NextRequest } from "next/server";
import db from "@/lib/db";

export async function GET(): Promise<Response> {
  try {
    const events = await Promise.resolve(
      db.prepare('SELECT * FROM events').all()
    );
    return Response.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return Response.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const { title, description, date, ticketPrice, ticketCount } = body;

    if (!title || !date || !ticketPrice || !ticketCount) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const id = Math.random().toString(36).substring(7);
    
    await Promise.resolve(
      db.prepare(`
        INSERT INTO events (id, title, description, date, ticketPrice, ticketCount)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, title, description, date, ticketPrice, ticketCount)
    );

    const event = await Promise.resolve(
      db.prepare('SELECT * FROM events WHERE id = ?').get(id)
    );

    return Response.json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    return Response.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
} 