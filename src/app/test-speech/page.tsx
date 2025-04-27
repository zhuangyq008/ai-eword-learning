'use client'

import { useState, useEffect } from 'react'

export default function TestSpeechPage() {
  const [text, setText] = useState('Hello, this is a test.')
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [directResult, setDirectResult] = useState<any>(null)
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [clearCacheResult, setClearCacheResult] = useState<any>(null)
  
  // Fetch cache stats on page load
  useEffect(() => {
    fetchCacheStats()
  }, [])
  
  const fetchCacheStats = async () => {
    try {
      const response = await fetch('/api/cache-stats')
      const data = await response.json()
      console.log('Cache stats:', data)
      setCacheStats(data)
    } catch (error) {
      console.error('Error fetching cache stats:', error)
    }
  }
  
  const handleClearCache = async () => {
    setIsLoading(true)
    setClearCacheResult(null)
    
    try {
      const response = await fetch('/api/clear-cache', {
        method: 'DELETE'
      })
      const data = await response.json()
      console.log('Clear cache result:', data)
      setClearCacheResult(data)
      
      // Refresh cache stats
      fetchCacheStats()
    } catch (error) {
      console.error('Error clearing cache:', error)
      setError('清除缓存时出错')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestApi = async () => {
    setIsLoading(true)
    setError('')
    setTestResult(null)
    
    try {
      console.log('Calling test speech endpoint')
      const response = await fetch('/api/test-speech')
      const data = await response.json()
      console.log('Test endpoint response:', data)
      setTestResult(data)
    } catch (error) {
      console.error('Error testing API:', error)
      setError('测试 API 时出错')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDirectCall = async () => {
    setIsLoading(true)
    setError('')
    setDirectResult(null)
    
    try {
      console.log('Calling backend directly')
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/test-speech`)
      const data = await response.json()
      console.log('Direct call response:', data)
      setDirectResult(data)
    } catch (error) {
      console.error('Error calling backend directly:', error)
      setError('直接调用后端时出错')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setResult(null)
    
    try {
      console.log(`Generating speech for text: "${text}"`)
      
      // Call our API route
      const response = await fetch('/api/speech/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })
      
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data keys:', Object.keys(data))
      
      setResult(data)
      
      if (data.audio) {
        console.log('Audio data received, length:', data.audio.length)
        // Create and play audio from base64 string
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`)
        console.log('Audio object created, attempting to play')
        
        audio.onplay = () => console.log('Audio playback started')
        audio.onended = () => console.log('Audio playback ended')
        audio.onerror = (e) => console.error('Audio playback error:', e)
        
        audio.play().then(() => {
          console.log('Audio playback promise resolved')
        }).catch(err => {
          console.error('Audio play() promise rejected:', err)
        })
      } else {
        console.warn('No audio data in response')
      }
    } catch (error) {
      console.error('Error generating speech:', error)
      setError('生成语音时出错')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">语音生成测试</h1>
      
      <div className="max-w-2xl mx-auto mb-8">
        <h2 className="text-xl font-semibold mb-4">1. 缓存管理</h2>
        <div className="flex space-x-4 mb-4">
          <button
            className="btn btn-primary"
            onClick={fetchCacheStats}
            disabled={isLoading}
          >
            刷新缓存统计
          </button>
          <button
            className="btn btn-danger"
            onClick={handleClearCache}
            disabled={isLoading}
          >
            清除缓存
          </button>
        </div>
        
        {cacheStats && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h3 className="font-semibold">缓存统计:</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>缓存目录:</div>
              <div>{cacheStats.cache_dir}</div>
              
              <div>文件数量:</div>
              <div>{cacheStats.file_count}</div>
              
              <div>总大小:</div>
              <div>{cacheStats.total_size_mb} MB</div>
              
              <div>最早文件时间:</div>
              <div>{cacheStats.oldest_file_time || '无'}</div>
              
              <div>最新文件时间:</div>
              <div>{cacheStats.newest_file_time || '无'}</div>
            </div>
          </div>
        )}
        
        {clearCacheResult && (
          <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-md">
            {clearCacheResult.message}
          </div>
        )}
      </div>
      
      <div className="max-w-2xl mx-auto mb-8">
        <h2 className="text-xl font-semibold mb-4">2. 测试 API 连接</h2>
        <div className="flex space-x-4 mb-4">
          <button
            className="btn btn-primary"
            onClick={handleTestApi}
            disabled={isLoading}
          >
            测试 API 路由
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleDirectCall}
            disabled={isLoading}
          >
            直接调用后端
          </button>
        </div>
        
        {testResult && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h3 className="font-semibold">API 路由测试结果:</h3>
            <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(testResult, null, 2)}</pre>
          </div>
        )}
        
        {directResult && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h3 className="font-semibold">直接调用结果:</h3>
            <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(directResult, null, 2)}</pre>
          </div>
        )}
      </div>
      
      <div className="max-w-2xl mx-auto card">
        <h2 className="text-xl font-semibold mb-4">3. 测试语音生成</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="text" className="block text-lg font-medium mb-2">
              输入文本
            </label>
            <textarea
              id="text"
              className="input min-h-[100px]"
              placeholder="输入要转换为语音的文本"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? '处理中...' : '生成语音'}
            </button>
          </div>
        </form>
        
        {result && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">结果:</h3>
            <div className="p-4 bg-gray-100 rounded-md">
              <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </div>
            
            {result.audio && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">音频:</h4>
                <audio controls src={`data:audio/mp3;base64,${result.audio}`} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
