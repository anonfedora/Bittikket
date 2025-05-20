import Database from 'better-sqlite3';
import path from 'path';

// Initialize database
const db = new Database(path.join(process.cwd(), 'events.db'));

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    ticketPrice INTEGER NOT NULL,
    ticketCount INTEGER NOT NULL,
    ticketsSold INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    eventId TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'valid', 'used')),
    createdAt TEXT NOT NULL,
    invoiceId TEXT,
    invoiceRequest TEXT,
    invoiceStatus TEXT CHECK(invoiceStatus IN ('pending', 'paid', 'expired')),
    FOREIGN KEY (eventId) REFERENCES events(id)
  );
`);

export default db; 