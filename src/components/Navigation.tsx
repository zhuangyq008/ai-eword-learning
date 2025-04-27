'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:text-primary'
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-primary">
              智能背单词
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link 
                href="/" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/')}`}
              >
                首页
              </Link>
              <Link 
                href="/input" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/input')}`}
              >
                输入单词
              </Link>
              <Link 
                href="/learn" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/learn')}`}
              >
                学习单词
              </Link>
              <Link 
                href="/review" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/review')}`}
              >
                复习单词
              </Link>
              <Link 
                href="/history" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/history')}`}
              >
                学习历史
              </Link>
              <Link 
                href="/test-speech" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/test-speech')}`}
              >
                测试语音
              </Link>
            </div>
          </div>
          
          <div className="md:hidden">
            <button className="mobile-menu-button p-2 rounded-md text-gray-400 hover:text-primary focus:outline-none">
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      <div className="md:hidden hidden mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link 
            href="/" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/')}`}
          >
            首页
          </Link>
          <Link 
            href="/input" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/input')}`}
          >
            输入单词
          </Link>
          <Link 
            href="/learn" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/learn')}`}
          >
            学习单词
          </Link>
          <Link 
            href="/review" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/review')}`}
          >
            复习单词
          </Link>
          <Link 
            href="/history" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/history')}`}
          >
            学习历史
          </Link>
          <Link 
            href="/test-speech" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/test-speech')}`}
          >
            测试语音
          </Link>
        </div>
      </div>
    </nav>
  )
}
