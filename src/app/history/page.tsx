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

export default function HistoryPage() {
  const [records, setRecords] = useState<LearningRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  
  // Default user ID (in a real app, this would come from authentication)
  const userId = "default-user"

  useEffect(() => {
    // Load the learning records from the API
    const fetchLearningRecords = async () => {
      try {
        const response = await axios.get(`/api/learning-record/get?userId=${userId}`);
        
        if (response.data.records && response.data.records.length > 0) {
          // Sort records by creation date (newest first)
          const sortedRecords = [...response.data.records].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setRecords(sortedRecords);
        } else {
          // If no records, try to get from localStorage as fallback
          const storedWords = localStorage.getItem('processedWords');
          if (storedWords) {
            const parsedWords = JSON.parse(storedWords);
            
            // Convert to learning records format
            const fallbackRecords = parsedWords.map((word: Word) => ({
              wordId: Math.random().toString(36).substring(2, 15),
              userId,
              word: word.word,
              phonetic: word.phonetic,
              meaning: word.meaning,
              examples: word.examples,
              reviewCount: 0,
              lastReviewedAt: null,
              createdAt: new Date().toISOString(),
              isInReviewList: false
            }));
            
            setRecords(fallbackRecords);
          } else {
            setError('没有找到学习历史，请先输入单词');
          }
        }
      } catch (err) {
        console.error('Error fetching learning records:', err);
        setError('加载学习历史时出错');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLearningRecords();
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
          <p className="text-xl mb-4">没有学习历史</p>
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-text mb-8 text-center">学习历史</h1>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    单词
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    音标
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    中文含义
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record, index) => (
                  <tr key={record.wordId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-primary cursor-pointer hover:underline" onClick={() => playAudio(record.word)}>
                        {record.word}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{record.phonetic}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.meaning}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        className="text-primary hover:text-primary/80 mr-3"
                        onClick={() => {
                          // Navigate to learn page with this word
                          router.push(`/learn?wordId=${record.wordId}`)
                        }}
                      >
                        学习
                      </button>
                      <button 
                        className="text-accent hover:text-accent/80 mr-3"
                        onClick={() => playAudio(record.word)}
                      >
                        播放
                      </button>
                      <button 
                        className={`${record.isInReviewList ? 'text-gray-500' : 'text-green-600 hover:text-green-800'}`}
                        onClick={async () => {
                          if (!record.isInReviewList) {
                            try {
                              await axios.post('/api/learning-record/review', {
                                wordId: record.wordId,
                                userId,
                                addToReviewList: true
                              });
                              
                              // Update local state
                              const updatedRecords = records.map(r => 
                                r.wordId === record.wordId ? {...r, isInReviewList: true} : r
                              );
                              setRecords(updatedRecords);
                            } catch (err) {
                              console.error('Error adding to review list:', err);
                            }
                          }
                        }}
                        disabled={record.isInReviewList}
                      >
                        {record.isInReviewList ? '已添加到复习列表' : '添加到复习列表'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <button
            className="btn btn-primary"
            onClick={() => router.push('/')}
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  )
}
