import { NextResponse } from 'next/server';
import axios from 'axios';

// This API route calls the backend service to process words
export async function POST(request: Request) {
  try {
    const { words } = await request.json();
    
    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input. Please provide an array of words.' },
        { status: 400 }
      );
    }
    
    // Call the backend API to process the words
    // The backend will use Amazon Bedrock Claude to generate the word data
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    const response = await axios.post(`${backendUrl}/process-words`, { words });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error processing words:', error);
    
    // Return a more detailed error message in development
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to process words';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
