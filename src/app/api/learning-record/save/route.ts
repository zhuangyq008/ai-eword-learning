import { NextResponse } from 'next/server';
import axios from 'axios';

// This API route calls the backend service to save a learning record to DynamoDB
export async function POST(request: Request) {
  try {
    const { userId, word, addToReviewList } = await request.json();
    
    if (!word) {
      return NextResponse.json(
        { error: 'Invalid input. Please provide a word.' },
        { status: 400 }
      );
    }
    
    // Call the backend API to save the learning record to DynamoDB
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    const response = await axios.post(`${backendUrl}/save-learning-record`, { 
      userId, 
      word, 
      addToReviewList 
    });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error saving learning record:', error);
    
    // Return a more detailed error message in development
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to save learning record';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
