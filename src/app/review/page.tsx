'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

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

interface LearningRecord {
  wordId: string
  userId: string
  word: string
  phonetic: string
  meaning: string
  examples: Example[]
  reviewCount: number
  lastReviewedAt: string | null
  createdAt: string
  isInReviewList: boolean
}

export default function ReviewPage() {
  const [records, setRecords] = useState<LearningRecord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMeaning, setShowMeaning] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [incrementing, setIncrementing] = useState(false)
  const router = useRouter()
  
  // Default user ID (in a real app, this would come from authentication)
  const userId = "default-user"

  useEffect(() => {
    // Load the review list from the API
    const fetchReviewList = async () => {
      try {
        const response = await axios.get(`/api/learning-record/review?userId=${userId}`);
        
        if (response.data.records && response.data.records.length > 0) {
          // Shuffle the records for review
          const shuffledRecords = [...response.data.records].sort(() => Math.random() - 0.5);
          setRecords(shuffledRecords);
        } else {
          // If no records in review list, try to get from localStorage as fallback
          const storedWords = localStorage.getItem('processedWords');
          if (storedWords) {
            const parsedWords = JSON.parse(storedWords);
            // Shuffle the words for review
            const shuffledWords = [...parsedWords].sort(() => Math.random() - 0.5);
            
            // Convert to learning records format
            const fallbackRecords = shuffledWords.map((word: Word) => ({
              wordId: Math.random().toString(36).substring(2, 15),
              userId,
              word: word.word,
              phonetic: word.phonetic,
              meaning: word.meaning,
              examples: word.examples,
              reviewCount: 0,
              lastReviewedAt: null,
              createdAt: new Date().toISOString(),
              isInReviewList: true
            }));
            
            setRecords(fallbackRecords);
          } else {
            setError('没有找到需要复习的单词');
          }
        }
      } catch (err) {
        console.error('Error fetching review list:', err);
        setError('加载复习列表时出错');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReviewList();
  }, [userId]);

  const playAudio = async (text: string) => {
    try {
      // Call our API route that uses Amazon Polly
      const response = await fetch('/api/speech/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error('Error generating speech:', data.error);
        // Fall back to browser's speech synthesis if API fails
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
        return;
      }
      
      if (data.audio) {
        // Create and play audio from base64 string
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audio.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      // Fall back to browser's speech synthesis
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }

  const incrementReviewCount = async () => {
    if (!currentRecord || incrementing) return;
    
    setIncrementing(true);
    try {
      const response = await axios.post('/api/learning-record/increment', {
        wordId: currentRecord.wordId,
        userId
      });
      
      console.log('Increment response:', response.data);
      
      // Update the local record immediately even though the backend processes asynchronously
      const updatedRecords = [...records];
      updatedRecords[currentIndex] = {
        ...updatedRecords[currentIndex],
        reviewCount: (updatedRecords[currentIndex].reviewCount || 0) + 1,
        lastReviewedAt: new Date().toISOString()
      };
      setRecords(updatedRecords);
    } catch (err) {
      console.error('Error incrementing review count:', err);
    } finally {
      // Reduce the incrementing state duration since we're not waiting for the actual DB update
      setTimeout(() => {
        setIncrementing(false);
      }, 300); // Short delay to show feedback to user
    }
  };

  const handleNext = () => {
    if (currentIndex < records.length - 1) {
      // Increment review count for the current word
      incrementReviewCount();
      
      // Move to the next word
      setCurrentIndex(currentIndex + 1);
      setShowMeaning(false);
      setShowExamples(false);
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowMeaning(false);
      setShowExamples(false);
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

  if (records.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto card">
          <p className="text-xl mb-4">没有单词可以复习</p>
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

  const currentRecord = records[currentIndex];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-accent">复习单词</h1>
          <div className="text-gray-600">
            {currentIndex + 1} / {records.length}
          </div>
        </div>
        
        <div className="card mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 
                className="text-3xl font-bold mb-2 cursor-pointer hover:text-accent"
                onClick={() => playAudio(currentRecord.word)}
              >
                {currentRecord.word}
              </h2>
              <p className="text-gray-600 mb-1">{currentRecord.phonetic}</p>
              
              {!showMeaning ? (
                <button
                  className="btn btn-secondary mt-2"
                  onClick={() => setShowMeaning(true)}
                >
                  显示中文含义
                </button>
              ) : (
                <div className="mt-2">
                  <p className="text-lg font-medium">{currentRecord.meaning}</p>
                </div>
              )}
              
              {currentRecord.reviewCount > 0 && (
                <div className="mt-2 text-sm text-gray-500">
                  已复习 {currentRecord.reviewCount} 次
                  {currentRecord.lastReviewedAt && (
                    <span> · 上次复习: {new Date(currentRecord.lastReviewedAt).toLocaleDateString()}</span>
                  )}
                </div>
              )}
            </div>
            <button
              className="p-2 rounded-full bg-accent text-white"
              onClick={() => playAudio(currentRecord.word)}
              aria-label="播放发音"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
          </div>
          
          {!showExamples ? (
            <div className="text-center">
              <button
                className="btn btn-secondary"
                onClick={() => setShowExamples(true)}
              >
                显示例句
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">例句：</h3>
              {currentRecord.examples.map((example, index) => (
                <div key={index} className="border-l-4 border-accent pl-4 py-2">
                  <p 
                    className="mb-1 cursor-pointer hover:text-accent"
                    onClick={() => playAudio(example.en.replace(/\*\*/g, ''))}
                    dangerouslySetInnerHTML={{ __html: example.en.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-accent">$1</strong>') }}
                  />
                  <p className="text-gray-600">{example.zh}</p>
                </div>
              ))}
            </div>
          )}
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
            disabled={currentIndex === records.length - 1 || incrementing}
          >
            {incrementing ? '保存中...' : '下一个'}
          </button>
        </div>
      </div>
    </div>
  )
}
