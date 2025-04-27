import Link from 'next/link'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4">智能背单词应用</h1>
        <p className="text-xl text-gray-600">使用AI技术辅助英语单词学习</p>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/input" className="card hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-primary mb-2">输入单词</h2>
            <p className="text-gray-600">输入您想要学习的单词列表</p>
          </Link>
          
          <Link href="/learn" className="card hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-secondary mb-2">学习单词</h2>
            <p className="text-gray-600">开始学习您的单词列表</p>
          </Link>
          
          <Link href="/review" className="card hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-accent mb-2">复习单词</h2>
            <p className="text-gray-600">复习您已学习的单词</p>
          </Link>
          
          <Link href="/history" className="card hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-text mb-2">学习历史</h2>
            <p className="text-gray-600">查看您的学习进度和历史</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
