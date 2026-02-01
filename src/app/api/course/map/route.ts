import { NextRequest, NextResponse } from 'next/server';
import { generateMapIllustration } from '@/lib/vertex';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shops, station } = body;

    if (!shops || !Array.isArray(shops) || shops.length === 0) {
      return NextResponse.json({ error: 'Shops are required' }, { status: 400 });
    }

    const mapUrl = await generateMapIllustration(shops, station || 'Unknown Location'); // Currently returns placeholder/null

    // Mocking a successful generation response for now since actual image gen needs more setup
    // In a real scenario, we would return the base64 or URL from Vertex
    const mockMapUrl = mapUrl || "https://placehold.co/800x600/png?text=Generated+Walking+Course+Map";

    return NextResponse.json({ mapUrl: mockMapUrl });
  } catch (error) {
    console.error('Map Generation API Error:', error);
    return NextResponse.json({ error: 'Failed to generate map' }, { status: 500 });
  }
}
