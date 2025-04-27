import { NextResponse } from 'next/server';
import axios from 'axios';

// This API route calls the backend service to increment the review count of a word
export async function POST(request: Request) {
  try {
    const { wordId, userId } = await request.json();
    
    if (!wordId || !userId) {
      return NextResponse.json(
        { error: 'Invalid input. Please provide wordId and userId.' },
        { status: 400 }
      );
    }
    
    // Call the backend API to increment the review count
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    const response = await axios.post(`${backendUrl}/increment-review-count`, null, {
      params: { wordId, userId }
    });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error incrementing review count:', error);
    
    // Return a more detailed error message in development
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to increment review count';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
