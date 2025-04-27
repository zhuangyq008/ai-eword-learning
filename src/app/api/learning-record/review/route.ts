import { NextResponse } from 'next/server';
import axios from 'axios';

// This API route calls the backend service to get the review list from DynamoDB
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
    
    // Call the backend API to get the review list from DynamoDB
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    const response = await axios.get(`${backendUrl}/get-review-list?userId=${userId}`);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error getting review list:', error);
    
    // Return a more detailed error message in development
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to get review list';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// This API route calls the backend service to update the review status of a word
export async function POST(request: Request) {
  try {
    const { wordId, userId, addToReviewList } = await request.json();
    
    if (!wordId || !userId) {
      return NextResponse.json(
        { error: 'Invalid input. Please provide wordId and userId.' },
        { status: 400 }
      );
    }
    
    // Call the backend API to update the review status
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    const response = await axios.post(`${backendUrl}/update-review-status`, null, {
      params: { wordId, userId, addToReviewList }
    });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating review status:', error);
    
    // Return a more detailed error message in development
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to update review status';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
