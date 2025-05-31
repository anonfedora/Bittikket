# Bitcoin-Based Event Ticketing System

A decentralized event ticketing platform built with Next.js and Bitcoin Lightning Network. This system allows event organizers to create events and issue tickets as Bitcoin invoices, with the ability to verify ticket ownership and enable secure ticket transfers.

## Features

- Create and manage events with customizable ticket prices and quantities
- Purchase tickets using Bitcoin Lightning Network
- View and manage your tickets
- Transfer tickets securely using Bitcoin transactions
- QR code-based ticket verification
- Real-time ticket ownership tracking
- Secure ticket transfer history

## Tech Stack

- Next.js 15
- TypeScript
- Bitcoin Core
- Lightning Network
- Tailwind CSS
- React QR Code

## Getting Started

1. Clone the repository:

```bash
git clone <repository-url>
cd bitcoin-event-ticketing
```

2. Install dependencies:

```bash
npm install
```

3. Set up your environment variables:
Create a `.env.local` file with the following variables:
```
BITCOIN_RPC_HOST=localhost
BITCOIN_RPC_PORT=18443
BITCOIN_RPC_USER=your_rpc_user
BITCOIN_RPC_PASS=your_rpc_password
LND_HOST=localhost
LND_PORT=10009
LND_MACAROON=your_macaroon
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── events/
│   │       ├── route.ts
│   │       └── [eventId]/
│   │           └── tickets/
│   │               ├── route.ts
│   │               └── [ticketId]/
│   │                   └── transfer/
│   │                       └── route.ts
│   ├── events/
│   │   ├── page.tsx
│   │   ├── create/
│   │   │   └── page.tsx
│   │   └── [eventId]/
│   │       └── page.tsx
│   └── layout.tsx
├── components/
│   └── TicketDetails.tsx
├── types/
│   └── event.ts
└── lib/
    ├── bitcoin.ts
    └── lightning.ts
```

## Usage

### Creating an Event

1. Navigate to the events page
2. Click "Create Event"
3. Fill in the event details:
   - Event name
   - Description
   - Date and time
   - Location
   - Ticket price (in sats)
   - Total number of tickets

### Purchasing Tickets

1. Browse available events
2. Select an event
3. Enter the quantity of tickets
4. Provide your Bitcoin address
5. Complete the payment using Lightning Network

### Transferring Tickets

1. Go to your tickets
2. Select the ticket you want to transfer
3. Enter the recipient's Bitcoin address
4. Confirm the transfer

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
