import { NextResponse } from 'next/server';
import axios from 'axios';

// This API route calls the backend service's test-speech endpoint
export async function GET() {
  try {
    console.log('Test speech API route called');
    
    // Call the backend API test endpoint
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    console.log(`Calling backend API at: ${backendUrl}/test-speech`);
    
    const response = await axios.get(`${backendUrl}/test-speech`);
    console.log('Backend API response status:', response.status);
    console.log('Backend API response data:', response.data);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error testing speech API:', error);
    
    // Return a more detailed error message in development
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to test speech API';
      
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
