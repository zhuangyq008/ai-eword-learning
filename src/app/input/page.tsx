'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function InputPage() {
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputText.trim()) {
      setError('请输入至少一个单词')
      return
    }
    
    // Split the input text by spaces, commas, or new lines
    const words = inputText
      .split(/[\s,\n]+/)
      .map(word => word.trim())
      .filter(word => word.length > 0)
    
    if (words.length === 0) {
      setError('请输入至少一个单词')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      // Send the words to the API
      const response = await axios.post('/api/words/process', { words })
      
      // Store the processed words in localStorage for now
      // In a real app, we might use a more robust state management solution
      localStorage.setItem('processedWords', JSON.stringify(response.data.words))
      
      // Redirect to the learn page
      router.push('/learn')
    } catch (err) {
      console.error('Error processing words:', err)
      setError('处理单词时出错，请稍后再试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-8 text-center">输入单词</h1>
      
      <div className="max-w-2xl mx-auto card">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="words" className="block text-lg font-medium mb-2">
              请输入您想要学习的单词
            </label>
            <textarea
              id="words"
              className="input min-h-[200px]"
              placeholder="输入单词，用空格、逗号或换行分隔（例如：apple banana orange）"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 mt-2">
              提示：您可以一次输入多个单词，用空格、逗号或换行分隔
            </p>
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
              {isLoading ? '处理中...' : '开始学习'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
