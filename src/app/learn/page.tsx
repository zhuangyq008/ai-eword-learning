'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Example {
  en: string
  zh: string
}

interface Word {
  word: string
  phonetic: string
  meaning: string
  examples: Example[]
}

export default function LearnPage() {
  const [words, setWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Load the processed words from localStorage
    const storedWords = localStorage.getItem('processedWords')
    
    if (!storedWords) {
      setError('没有找到单词数据，请先输入单词')
      setIsLoading(false)
      return
    }
    
    try {
      const parsedWords = JSON.parse(storedWords)
      setWords(parsedWords)
      setIsLoading(false)
    } catch (err) {
      console.error('Error parsing stored words:', err)
      setError('加载单词数据时出错')
      setIsLoading(false)
    }
  }, [])

  const currentWord = words[currentIndex]

  const playAudio = async (text: string) => {
    console.log(`Attempting to play audio for text: "${text}"`);
    try {
      // Call our API route that uses Amazon Polly
      console.log('Sending request to /api/speech/generate');
      const response = await fetch('/api/speech/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data keys:', Object.keys(data));
      
      if (data.error) {
        console.error('Error generating speech:', data.error);
        console.log('Falling back to browser speech synthesis');
        // Fall back to browser's speech synthesis if API fails
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
        return;
      }
      
      if (data.audio) {
        console.log('Audio data received, length:', data.audio.length);
        // Create and play audio from base64 string
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        console.log('Audio object created, attempting to play');
        
        audio.onplay = () => console.log('Audio playback started');
        audio.onended = () => console.log('Audio playback ended');
        audio.onerror = (e) => console.error('Audio playback error:', e);
        
        audio.play().then(() => {
          console.log('Audio playback promise resolved');
        }).catch(err => {
          console.error('Audio play() promise rejected:', err);
        });
      } else {
        console.warn('No audio data in response');
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      console.log('Falling back to browser speech synthesis due to error');
      // Fall back to browser's speech synthesis
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-xl">加载中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto card bg-red-50">
          <p className="text-red-700 mb-4">{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => router.push('/input')}
          >
            返回输入页面
          </button>
        </div>
      </div>
    )
  }

  if (!currentWord) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto card">
          <p className="text-xl mb-4">没有单词可以学习</p>
          <button
            className="btn btn-primary"
            onClick={() => router.push('/input')}
          >
            返回输入页面
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">学习单词</h1>
          <div className="text-gray-600">
            {currentIndex + 1} / {words.length}
          </div>
        </div>
        
        <div className="card mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 
                className="text-3xl font-bold mb-2 cursor-pointer hover:text-primary"
                onClick={() => playAudio(currentWord.word)}
              >
                {currentWord.word}
              </h2>
              <p className="text-gray-600 mb-1">{currentWord.phonetic}</p>
              <p className="text-lg">{currentWord.meaning}</p>
            </div>
            <button
              className="p-2 rounded-full bg-primary text-white"
              onClick={() => playAudio(currentWord.word)}
              aria-label="播放发音"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">例句：</h3>
            {currentWord.examples.map((example, index) => (
              <div key={index} className="border-l-4 border-primary pl-4 py-2">
                <p 
                  className="mb-1 cursor-pointer hover:text-primary"
                  onClick={() => playAudio(example.en.replace(/\*\*/g, ''))}
                  dangerouslySetInnerHTML={{ __html: example.en.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-primary">$1</strong>') }}
                />
                <p className="text-gray-600">{example.zh}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            className="btn btn-secondary"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            上一个
          </button>
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={currentIndex === words.length - 1}
          >
            下一个
          </button>
        </div>
      </div>
    </div>
  )
}
