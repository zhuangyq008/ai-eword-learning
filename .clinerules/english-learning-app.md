## 文档搜索

在需要查询 Next.js 和 Tailwind CSS相关文档时，务必使用Context7 以获取最新的，版本相关的文档，明确包含'use context7'

## 技术栈偏好

- **前端框架**: **Next.js(稳定版本)**。 请优先使用最新稳定版本的Next.js来构建用户界面
- **样式库**: **Tailwind CSS (最新版)**。所有的样式都应用使用最新版本
- **后端编程语言**: **Python+FastAPI**。 相关的文档务必使用Context7 以获取最新的，版本相关的文档，明确包含'use context7'
- **AWS SDK**: **使用AWS SDK Boto3**。 Boto3请使用最新的库及最新的文档，使用Context7以获取最新的，版本相关的文档，明确包含'use context7'
- **LLM**: **使用Amazon Bedrock调用基础模型**。 从boto3获取bedrock-runtime进行调用，使用Context7以获取最新的，版本相关的文档，明确包含'use context7'
- **包管理**: **使用uv管理依赖**。

## 应用的核心逻辑

本项目创建一个只能背单词。以下时核心功能和Cline在开发过程中应该考虑的事项：

- **用户输入**: 应用需要用户提供多个单词的界面
- **单词接收**: 前端需要能够接收用户输入的单词列表
- **API调用**: 前端需要调用后端的API路由，将用户输入的单词列表发送给后端。
- **Amazon Bedrock Claude**: 后端API将消息解析后并结合下面prompt ，API将获取到LLM返回的JSON结构

  ```
  ## Instruction
  You are an expert English teacher specializing in vocabulary instruction. Your task is to create bilingual learning materials for a given word list, following these requirements:

  1. Provide the standard phonetic transcription for each word.
  2. Provide the Chinese translation of each word's primary meaning.
  3. For each word, provide three example sentences that meet the following criteria:
      - Concise (under 15 words)
      - Suitable for intermediate English learners
      - Demonstrate varied usage and contexts
      - Use natural, idiomatic expressions
      - Include Chinese translations
      - Mark the target word in **bold** format

  ## Output Format
  Your response MUST follow this exact JSON structure:
  {{"words": [
  {
  "word": "target_word",
  "phonetic": "phonetic_transcription",
  "meaning": "chinese_meaning",
  "examples": [
  {"en": "Example sentence with the **target_word**.", "zh": "对应的中文翻译"}},
  {{"en": "Another example with the **target_word**.", "zh": "对应的中文翻译"}},
  {{"en": "Final example using the **target_word**.", "zh": "对应的中文翻译"}}
  ]
  }
  ]
  }

  Do not include any text outside the JSON structure.
  ```
- **单词交互**: 当用户点击单词或例句将会调用Amazon Polly 将获取英文的语音文件并播放
- **数据保存**: 数据保存到Amazon DynamoDB. 用户生词表，学习历史，复习表
