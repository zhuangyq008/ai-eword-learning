import { NextResponse } from 'next/server';
import axios from 'axios';

// This API route calls the backend service to save a word list to DynamoDB
export async function POST(request: Request) {
  try {
    const { name, words } = await request.json();
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid input. Please provide a name for the word list.' },
        { status: 400 }
      );
    }
    
    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input. Please provide an array of words.' },
        { status: 400 }
      );
    }
    
    // Call the backend API to save the word list to DynamoDB
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    const response = await axios.post(`${backendUrl}/save-wordlist`, { name, words });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error saving word list:', error);
    
    // Return a more detailed error message in development
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to save word list';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
