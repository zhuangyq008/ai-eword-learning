import { NextResponse } from 'next/server';
import axios from 'axios';

// This API route calls the backend service to clear the audio cache
export async function DELETE() {
  try {
    console.log('Clear cache API route called');
    
    // Call the backend API to clear the cache
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    console.log(`Calling backend API at: ${backendUrl}/clear-cache`);
    
    const response = await axios.delete(`${backendUrl}/clear-cache`);
    console.log('Backend API response status:', response.status);
    console.log('Backend API response data:', response.data);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error clearing cache:', error);
    
    // Return a more detailed error message in development
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to clear cache';
      
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
