import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    // Get WAHA API URL from runtime config
    const wahaApiUrl = process.env.NEXT_PUBLIC_WAHA_URL!;
    const wahaApiKey = process.env.WAHA_API_KEY;
    
    // Create headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add API key if available
    if (wahaApiKey) {
      headers['X-Api-Key'] = wahaApiKey;
    }
    
    // Try to ping the WAHA API
    let isRunning = false;
    let errorMessage = null;
    
    try {
      // Attempt to call the WAHA API
      const response = await axios.get(`${wahaApiUrl}/`, { 
        headers
      });
      
      isRunning = response.status === 200;
      
    } catch (error: any) {
      isRunning = false;
      errorMessage = error.message ?? 'Could not connect to WAHA API';
    }
    
    return NextResponse.json({
      wahaApiUrl,
      hasApiKey: !!wahaApiKey,
      isRunning,
      errorMessage,
      checkTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking WAHA status:', error);
    return NextResponse.json({ 
      isRunning: false,
      errorMessage: 'Internal Server Error',
      checkTime: new Date().toISOString()
    }, { status: 500 });
  }
} 