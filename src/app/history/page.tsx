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

export default function HistoryPage() {
  const [words, setWords] = useState<Word[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Load the processed words from localStorage
    const storedWords = localStorage.getItem('processedWords')
    
    if (!storedWords) {
      setError('没有找到学习历史，请先输入单词')
      setIsLoading(false)
      return
    }
    
    try {
      const parsedWords = JSON.parse(storedWords)
      setWords(parsedWords)
      setIsLoading(false)
    } catch (err) {
      console.error('Error parsing stored words:', err)
      setError('加载学习历史时出错')
      setIsLoading(false)
    }
  }, [])

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

  if (words.length === 0) {
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
                {words.map((word, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-primary cursor-pointer hover:underline" onClick={() => playAudio(word.word)}>
                        {word.word}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{word.phonetic}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{word.meaning}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        className="text-primary hover:text-primary/80 mr-3"
                        onClick={() => {
                          // Store the current word in localStorage and navigate to learn page
                          localStorage.setItem('currentWordIndex', index.toString())
                          router.push('/learn')
                        }}
                      >
                        学习
                      </button>
                      <button 
                        className="text-accent hover:text-accent/80"
                        onClick={() => playAudio(word.word)}
                      >
                        播放
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
