# 智能背单词应用

一个使用 Next.js 和 FastAPI 构建的智能英语单词学习应用，集成了 Amazon Bedrock Claude 和 Amazon Polly 等 AI 服务。

## 功能特点

- 用户可以输入多个单词进行学习
- 使用 Amazon Bedrock Claude 生成单词的详细学习材料
  - 音标
  - 中文含义
  - 英文例句及中文翻译
- 使用 Amazon Polly 提供单词和例句的语音播放（支持本地缓存）
- 使用 Amazon DynamoDB 存储单词列表和学习历史
- 提供学习、复习和历史记录功能
- 响应式设计，支持移动端和桌面端

## 技术栈

### 前端

- **Next.js**: React 框架，用于构建用户界面
- **TypeScript**: 类型安全的 JavaScript 超集
- **Tailwind CSS**: 实用优先的 CSS 框架
- **Axios**: HTTP 客户端，用于 API 请求

### 后端

- **FastAPI**: 高性能的 Python Web 框架
- **Pydantic**: 数据验证和设置管理
- **Boto3**: AWS SDK for Python，用于调用 AWS 服务
- **Uvicorn**: ASGI 服务器，用于运行 FastAPI 应用

### AWS 服务

- **Amazon Bedrock Claude**: 用于生成单词学习材料
- **Amazon Polly**: 用于语音合成
- **Amazon DynamoDB**: 用于数据存储（用户生词表、学习历史等）

## 环境要求

### 前端
- Node.js 18.x 或更高版本
- npm 9.x 或更高版本

### 后端
- Python 3.9 或更高版本
- pip 22.x 或更高版本
- 虚拟环境工具（推荐使用 venv 或 conda）

### AWS 配置
- AWS 账户
- 配置好的 AWS CLI 凭证
- 以下 AWS 服务的访问权限：
  - Amazon Bedrock
  - Amazon Polly
  - Amazon DynamoDB

## 项目结构

```
english-learning-app/
├── src/                      # 前端源代码
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # 前端 API 路由
│   │   │   ├── words/        # 单词处理 API
│   │   │   ├── speech/       # 语音生成 API
│   │   │   ├── wordlist/     # 单词列表 API
│   │   │   ├── cache-stats/  # 缓存统计 API
│   │   │   └── clear-cache/  # 缓存清理 API
│   │   ├── input/            # 单词输入页面
│   │   ├── learn/            # 单词学习页面
│   │   ├── review/           # 单词复习页面
│   │   ├── history/          # 学习历史页面
│   │   ├── test-speech/      # 语音测试页面
│   │   ├── layout.tsx        # 全局布局
│   │   └── page.tsx          # 首页
│   ├── components/           # React 组件
│   ├── lib/                  # 工具函数和库
│   └── styles/               # 全局样式
├── backend/                  # 后端源代码
│   ├── app/                  # FastAPI 应用
│   │   └── main.py           # 主应用文件
│   ├── requirements.txt      # Python 依赖
│   └── run.py                # 运行脚本
├── public/                   # 静态资源
├── audio_cache/              # 音频缓存目录（自动创建）
├── package.json              # 前端依赖和脚本
├── tsconfig.json             # TypeScript 配置
├── tailwind.config.js        # Tailwind CSS 配置
├── .env.example              # 环境变量示例
└── README.md                 # 项目文档
```

## 安装与部署

### 环境配置

1. **克隆仓库**
   ```bash
   git clone https://github.com/yourusername/english-learning-app.git
   cd english-learning-app
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env
   ```
   
   编辑 `.env` 文件，填入以下信息：
   ```
   # 前端环境变量
   NEXT_PUBLIC_API_URL=http://localhost:8000
   
   # 后端环境变量
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   AWS_REGION=us-east-1
   ```

### 前端部署

1. **安装依赖**
   ```bash
   npm install
   ```

2. **开发模式**
   ```bash
   npm run dev
   ```
   
   应用将在 http://localhost:3000 运行

3. **生产构建**
   ```bash
   npm run build
   npm start
   ```

### 后端部署

1. **创建并激活虚拟环境**
   ```bash
   # Linux/Mac
   python -m venv venv
   source venv/bin/activate
   
   # Windows
   python -m venv venv
   venv\Scripts\activate
   ```

2. **安装依赖**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **运行开发服务器**
   ```bash
   python run.py
   ```
   
   API 将在 http://localhost:8000 运行

4. **生产部署**
   
   对于生产环境，建议使用 Gunicorn 或 Uvicorn 与 Nginx 配合：
   ```bash
   pip install gunicorn
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.app.main:app
   ```

## API 文档

### 前端 API 路由

| 路由 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/api/words/process` | POST | 处理单词列表 | `{ words: string[] }` |
| `/api/speech/generate` | POST | 生成语音 | `{ text: string }` |
| `/api/wordlist/save` | POST | 保存单词列表 | `{ name: string, words: Word[], userId: string }` |
| `/api/wordlist/get` | GET | 获取用户的单词列表 | `userId` (查询参数) |
| `/api/wordlist/get` | POST | 获取特定单词列表 | `{ listId: string }` |
| `/api/cache-stats` | GET | 获取缓存统计信息 | 无 |
| `/api/clear-cache` | DELETE | 清除音频缓存 | 无 |
| `/api/test-speech` | GET | 测试语音 API | 无 |

### 后端 API 端点

| 端点 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/` | GET | API 根路径，返回状态信息 | 无 |
| `/process-words` | POST | 处理单词列表 | `{ words: string[] }` |
| `/generate-speech` | POST | 生成语音 | `{ text: string }` |
| `/save-wordlist` | POST | 保存单词列表到 DynamoDB | `{ name: string, words: Word[], userId: string }` |
| `/get-wordlists` | GET | 获取用户的单词列表 | `userId` (查询参数) |
| `/get-wordlist/{list_id}` | GET | 获取特定单词列表 | `list_id` (路径参数) |
| `/cache-stats` | GET | 获取缓存统计信息 | 无 |
| `/clear-cache` | DELETE | 清除音频缓存 | 无 |
| `/test-speech` | GET | 测试语音 API | 无 |

## 数据模型

### Word（单词）
```typescript
interface Word {
  word: string;        // 单词
  phonetic: string;    // 音标
  meaning: string;     // 中文含义
  examples: Example[]; // 例句列表
}
```

### Example（例句）
```typescript
interface Example {
  en: string; // 英文例句
  zh: string; // 中文翻译
}
```

### WordList（单词列表）
```typescript
interface WordList {
  id: string;          // 列表 ID
  name: string;        // 列表名称
  words: Word[];       // 单词列表
  userId: string;      // 用户 ID
  createdAt: string;   // 创建时间
  updatedAt: string;   // 更新时间
}
```

## 使用流程

1. 在"输入单词"页面输入想要学习的单词列表
2. 系统调用 Amazon Bedrock Claude 生成学习材料
3. 在"学习单词"页面查看单词详情和例句
4. 点击单词或例句可以通过 Amazon Polly 播放发音（首次播放会缓存音频）
5. 在"复习单词"页面进行复习
6. 在"学习历史"页面查看学习记录
7. 在"测试语音"页面可以测试语音生成功能和管理音频缓存

## 缓存机制

应用实现了音频缓存功能，可以将生成的单词和例句音频文件缓存到本地，避免重复调用 Amazon Polly API：

1. 首次请求语音时，系统会调用 Amazon Polly 生成音频并保存到本地缓存
2. 后续相同文本的请求会直接从缓存中读取音频数据
3. 管理员可以通过"测试语音"页面查看缓存统计和清除缓存

## 故障排除

### 常见问题

1. **无法连接到后端 API**
   - 确保后端服务器正在运行
   - 检查 `.env` 文件中的 `NEXT_PUBLIC_API_URL` 是否正确

2. **AWS 服务调用失败**
   - 验证 AWS 凭证是否正确配置
   - 检查是否有相应服务的访问权限
   - 查看后端日志获取详细错误信息

3. **音频播放问题**
   - 检查浏览器控制台是否有错误信息
   - 验证音频缓存目录是否存在且可写
   - 尝试清除缓存并重新生成音频

### 日志查看

- **前端日志**: 浏览器开发者工具的控制台
- **后端日志**: 终端窗口或日志文件（取决于部署方式）

## 未来计划

- 添加用户认证系统
- 实现单词学习进度跟踪
- 添加智能复习计划生成
- 支持单词导入/导出功能
- 添加更多学习统计和分析功能
- 优化缓存管理，支持缓存过期和自动清理
