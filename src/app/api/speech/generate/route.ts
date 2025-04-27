import { NextResponse } from 'next/server';
import axios from 'axios';

// This API route calls the backend service to generate speech using Amazon Polly
export async function POST(request: Request) {
  try {
    console.log('Speech generation API route called');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { text } = body;
    
    if (!text || typeof text !== 'string' || text.trim() === '') {
      console.error('Invalid input: text is missing or empty');
      return NextResponse.json(
        { error: 'Invalid input. Please provide text to synthesize.' },
        { status: 400 }
      );
    }
    
    console.log(`Generating speech for text: "${text}"`);
    
    // Call the backend API to generate speech
    // The backend will use Amazon Polly to convert text to speech
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    console.log(`Calling backend API at: ${backendUrl}/generate-speech`);
    
    const response = await axios.post(`${backendUrl}/generate-speech`, { text });
    console.log('Backend API response status:', response.status);
    console.log('Backend API response has audio:', !!response.data.audio);
    
    if (response.data.audio) {
      console.log('Audio data received, length:', response.data.audio.length);
    }
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error generating speech:', error);
    
    // Return a more detailed error message in development
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to generate speech';
      
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
