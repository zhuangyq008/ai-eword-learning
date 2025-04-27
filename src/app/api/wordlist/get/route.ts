import { NextResponse } from 'next/server';
import axios from 'axios';

// This API route calls the backend service to get word lists from DynamoDB
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
    
    // Call the backend API to get the word lists from DynamoDB
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    const response = await axios.get(`${backendUrl}/get-wordlists?userId=${userId}`);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error getting word lists:', error);
    
    // Return a more detailed error message in development
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to get word lists';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Get a specific word list by ID
export async function POST(request: Request) {
  try {
    const { listId } = await request.json();
    
    if (!listId) {
      return NextResponse.json(
        { error: 'Invalid input. Please provide a listId.' },
        { status: 400 }
      );
    }
    
    // Call the backend API to get the specific word list from DynamoDB
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    const response = await axios.get(`${backendUrl}/get-wordlist/${listId}`);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error getting word list:', error);
    
    // Return a more detailed error message in development
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to get word list';
      
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
