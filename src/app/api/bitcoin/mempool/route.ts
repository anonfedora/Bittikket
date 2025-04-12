import { NextResponse } from 'next/server';
import { bitcoin } from '@/lib/bitcoin';

export async function GET() {
  try {
    const mempoolInfo = await bitcoin.getMempoolInfo();
    const rawMempool = await bitcoin.getRawMempool();

    return NextResponse.json({
      status: 'success',
      data: {
        info: mempoolInfo,
        transactions: rawMempool
      }
    });
  } catch (error) {
    console.error('Error fetching mempool:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to fetch mempool data'
      },
      { status: 500 }
    );
  }
} 