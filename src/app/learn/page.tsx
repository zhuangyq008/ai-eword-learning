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

// Function to extract words from an example sentence
function extractWordsFromExample(example: string): string[] {
  // Remove the bold markers
  const cleanExample = example.replace(/\*\*/g, '')
  
  // Split by spaces and punctuation, and filter out empty strings
  return cleanExample
    .split(/[\s,.!?;:"'()[\]{}]/g)
    .map(word => word.trim().toLowerCase())
    .filter(word => word.length > 0)
    // Filter out common words (stop words)
    .filter(word => !['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'as', 'of', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those'].includes(word))
}

export default function LearnPage() {
  const [words, setWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [exampleWords, setExampleWords] = useState<string[]>([])
  const [selectedWord, setSelectedWord] = useState<string>('')
  const [savingWord, setSavingWord] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const router = useRouter()
  
  // Default user ID (in a real app, this would come from authentication)
  const userId = "default-user"

  useEffect(() => {
    // Check if there's a wordId in the URL
    const params = new URLSearchParams(window.location.search);
    const wordId = params.get('wordId');
    
    if (wordId) {
      // Load a specific word from the learning records
      const fetchWord = async () => {
        try {
          const response = await axios.get(`/api/learning-record/get?userId=${userId}`);
          
          if (response.data.records && response.data.records.length > 0) {
            // Find the specific word
            const record = response.data.records.find((r: LearningRecord) => r.wordId === wordId);
            
            if (record) {
              // Convert to Word format
              const word: Word = {
                word: record.word,
                phonetic: record.phonetic,
                meaning: record.meaning,
                examples: record.examples
              };
              
              setWords([word]);
              setCurrentIndex(0);
              setIsLoading(false);
            } else {
              setError('找不到指定的单词');
              setIsLoading(false);
            }
          } else {
            setError('没有找到学习记录');
            setIsLoading(false);
          }
        } catch (err) {
          console.error('Error fetching word:', err);
          setError('加载单词数据时出错');
          setIsLoading(false);
        }
      };
      
      fetchWord();
    } else {
      // Load the processed words from localStorage
      const storedWords = localStorage.getItem('processedWords');
      
      if (!storedWords) {
        setError('没有找到单词数据，请先输入单词');
        setIsLoading(false);
        return;
      }
      
      try {
        const parsedWords = JSON.parse(storedWords);
        setWords(parsedWords);
        setIsLoading(false);
      } catch (err) {
        console.error('Error parsing stored words:', err);
        setError('加载单词数据时出错');
        setIsLoading(false);
      }
    }
  }, [userId])
  
  // Extract words from examples when current word changes
  useEffect(() => {
    const currentWord = words[currentIndex]
    if (currentWord) {
      // Extract words from all examples
      const allWords = currentWord.examples.flatMap(example => 
        extractWordsFromExample(example.en)
      );
      
      // Remove duplicates and the current word itself
      const uniqueWords = Array.from(new Set(allWords))
        .filter(word => word.toLowerCase() !== currentWord.word.toLowerCase());
      
      setExampleWords(uniqueWords);
      setSelectedWord('');
      setSaveSuccess(null);
      setSaveError(null);
    }
  }, [words, currentIndex]);
  
  // Function to save a word to the learning records
  const saveWordToLearningRecords = async (word: string, addToReviewList: boolean) => {
    setSavingWord(true);
    setSaveSuccess(null);
    setSaveError(null);
    
    try {
      // Call Claude to get details for the word
      const response = await axios.post('/api/words/process', { words: [word] });
      const processedWord = response.data.words[0];
      
      // Save the word to learning records
      await axios.post('/api/learning-record/save', {
        userId,
        word: processedWord,
        addToReviewList
      });
      
      setSaveSuccess(`单词 "${word}" 已${addToReviewList ? '添加到复习列表' : '保存到学习记录'}`);
    } catch (error) {
      console.error('Error saving word:', error);
      setSaveError(`保存单词 "${word}" 时出错`);
    } finally {
      setSavingWord(false);
    }
  };

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

  const currentWord = words[currentIndex]
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
          
          {exampleWords.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">例句中的其他单词：</h3>
              <div className="flex flex-wrap gap-2">
                {exampleWords.map((word, index) => (
                  <button
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedWord === word 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                    onClick={() => setSelectedWord(word)}
                  >
                    {word}
                  </button>
                ))}
              </div>
              
              {selectedWord && (
                <div className="mt-4">
                  <div className="flex space-x-2">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => saveWordToLearningRecords(selectedWord, true)}
                      disabled={savingWord}
                    >
                      {savingWord ? '保存中...' : '添加到复习列表'}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => playAudio(selectedWord)}
                    >
                      播放发音
                    </button>
                  </div>
                  
                  {saveSuccess && (
                    <div className="mt-2 p-2 bg-green-100 text-green-700 rounded">
                      {saveSuccess}
                    </div>
                  )}
                  
                  {saveError && (
                    <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">
                      {saveError}
                    </div>
                  )}
                </div>
              )}
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
            disabled={currentIndex === words.length - 1}
          >
            下一个
          </button>
        </div>
      </div>
    </div>
  )
}
