import { NextResponse } from 'next/server';
import axios from 'axios';

// This API route calls the backend service to get learning records from DynamoDB
export async function GET(request: Request) {
  try {
    // Get the user ID from the query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid input. Please provide a userId.' },
        { status: 400 }
      );
    }
    
    // Call the backend API to get the learning records from DynamoDB
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    const response = await axios.get(`${backendUrl}/get-learning-records?userId=${userId}`);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error getting learning records:', error);
    
    // Return a more detailed error message in development
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to get learning records';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
