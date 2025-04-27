import { NextResponse } from 'next/server';
import axios from 'axios';

// This API route calls the backend service to get cache statistics
export async function GET() {
  try {
    console.log('Cache stats API route called');
    
    // Call the backend API to get cache statistics
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    console.log(`Calling backend API at: ${backendUrl}/cache-stats`);
    
    const response = await axios.get(`${backendUrl}/cache-stats`);
    console.log('Backend API response status:', response.status);
    console.log('Backend API response data:', response.data);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error getting cache stats:', error);
    
    // Return a more detailed error message in development
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to get cache stats';
      
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
