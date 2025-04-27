from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import boto3
import json
import os
import base64
import logging
import uuid
import hashlib
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create cache directory if it doesn't exist
CACHE_DIR = Path("audio_cache")
CACHE_DIR.mkdir(exist_ok=True)

app = FastAPI(title="英语学习 API", description="智能背单词应用的后端 API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class WordInput(BaseModel):
    words: List[str]

class Example(BaseModel):
    en: str
    zh: str

class Word(BaseModel):
    word: str
    phonetic: str
    meaning: str
    examples: List[Example]

class WordsResponse(BaseModel):
    words: List[Word]

class SpeechRequest(BaseModel):
    text: str

class WordListInput(BaseModel):
    name: str
    words: List[Word]
    userId: Optional[str] = "default-user"

class WordListResponse(BaseModel):
    id: str
    name: str
    words: List[Word]
    userId: str
    createdAt: str
    updatedAt: str

# Mock data for development
MOCK_DATA = {
    "apple": {
        "phonetic": "/ˈæp.əl/",
        "meaning": "苹果",
        "examples": [
            {"en": "I eat an **apple** every day.", "zh": "我每天吃一个苹果。"},
            {"en": "She cut the **apple** into slices.", "zh": "她把苹果切成片。"},
            {"en": "The **apple** tree produced a lot of fruit this year.", "zh": "今年这棵苹果树结了很多果。"},
        ]
    },
    "banana": {
        "phonetic": "/bəˈnɑː.nə/",
        "meaning": "香蕉",
        "examples": [
            {"en": "Monkeys love to eat **bananas**.", "zh": "猴子喜欢吃香蕉。"},
            {"en": "I added a **banana** to my smoothie.", "zh": "我在冰沙中加了一根香蕉。"},
            {"en": "The **banana** was perfectly ripe.", "zh": "这根香蕉熟得恰到好处。"},
        ]
    },
    "orange": {
        "phonetic": "/ˈɒr.ɪndʒ/",
        "meaning": "橙子",
        "examples": [
            {"en": "I squeezed an **orange** to make juice.", "zh": "我挤了一个橙子来制作果汁。"},
            {"en": "The **orange** is a citrus fruit.", "zh": "橙子是一种柑橘类水果。"},
            {"en": "She peeled the **orange** carefully.", "zh": "她小心地剥橙子皮。"},
        ]
    }
}

@app.get("/")
async def root():
    return {"message": "英语学习 API 正在运行"}

@app.get("/cache-stats")
async def cache_stats():
    """
    Get statistics about the audio cache
    """
    try:
        # Count the number of cached files
        cache_files = list(CACHE_DIR.glob("*.mp3"))
        
        # Calculate the total size of the cache
        total_size = sum(f.stat().st_size for f in cache_files)
        
        # Get the creation time of the oldest and newest files
        if cache_files:
            oldest_file = min(cache_files, key=lambda f: f.stat().st_ctime)
            newest_file = max(cache_files, key=lambda f: f.stat().st_ctime)
            oldest_time = datetime.fromtimestamp(oldest_file.stat().st_ctime).isoformat()
            newest_time = datetime.fromtimestamp(newest_file.stat().st_ctime).isoformat()
        else:
            oldest_time = None
            newest_time = None
        
        return {
            "cache_dir": str(CACHE_DIR),
            "file_count": len(cache_files),
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "oldest_file_time": oldest_time,
            "newest_file_time": newest_time,
            "status": "success"
        }
    except Exception as e:
        logging.error(f"Error getting cache stats: {str(e)}")
        return {"message": f"获取缓存统计信息失败: {str(e)}", "status": "error"}

@app.delete("/clear-cache")
async def clear_cache():
    """
    Clear the audio cache
    """
    try:
        # Get all cache files
        cache_files = list(CACHE_DIR.glob("*.mp3"))
        file_count = len(cache_files)
        
        # Delete all cache files
        for file in cache_files:
            file.unlink()
        
        logging.info(f"Cleared {file_count} files from cache")
        
        return {
            "message": f"已清除缓存中的 {file_count} 个文件",
            "status": "success"
        }
    except Exception as e:
        logging.error(f"Error clearing cache: {str(e)}")
        return {"message": f"清除缓存失败: {str(e)}", "status": "error"}

@app.get("/test-speech")
async def test_speech():
    """
    Test endpoint for speech generation
    """
    logging.info("Test speech endpoint called")
    try:
        # Generate a simple test response
        return {
            "audio": "test_audio_base64_string",
            "format": "mp3",
            "status": "success",
            "message": "This is a test response to verify the API is working"
        }
    except Exception as e:
        logging.error(f"Error in test speech endpoint: {str(e)}")
        return {"message": f"测试失败: {str(e)}", "status": "error"}

@app.post("/process-words", response_model=WordsResponse)
async def process_words(word_input: WordInput):
    """
    Process a list of words using Amazon Bedrock Claude
    """
    if not word_input.words:
        raise HTTPException(status_code=400, detail="请提供至少一个单词")
    
    try:
        # Call Amazon Bedrock Claude to process the words
        result = call_bedrock_claude(word_input.words)
        
        # Convert the result to the expected response model
        processed_words = []
        
        if "words" in result and isinstance(result["words"], list):
            for word_data in result["words"]:
                try:
                    processed_words.append(
                        Word(
                            word=word_data["word"],
                            phonetic=word_data["phonetic"],
                            meaning=word_data["meaning"],
                            examples=word_data["examples"]
                        )
                    )
                except KeyError as e:
                    logging.error(f"Missing key in word data: {e}")
                    # Skip this word if it's missing required fields
        
        # If no words were processed successfully, raise an exception
        if not processed_words:
            raise HTTPException(status_code=500, detail="处理单词失败，请稍后再试")
        
        return WordsResponse(words=processed_words)
    except Exception as e:
        logging.error(f"Error processing words: {str(e)}")
        raise HTTPException(status_code=500, detail=f"处理单词时出错: {str(e)}")

def get_audio_cache_path(text: str) -> Path:
    """
    Generate a cache file path for the given text
    """
    # Create a hash of the text to use as the filename
    text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()
    return CACHE_DIR / f"{text_hash}.mp3"

def get_cached_audio(text: str) -> Optional[str]:
    """
    Get cached audio for the given text if it exists
    """
    cache_path = get_audio_cache_path(text)
    if cache_path.exists():
        logging.info(f"Found cached audio for text: {text}")
        with open(cache_path, "rb") as f:
            audio_data = f.read()
            return base64.b64encode(audio_data).decode('utf-8')
    return None

def save_audio_to_cache(text: str, audio_data: bytes) -> None:
    """
    Save audio data to cache
    """
    cache_path = get_audio_cache_path(text)
    with open(cache_path, "wb") as f:
        f.write(audio_data)
    logging.info(f"Saved audio to cache for text: {text}")

@app.post("/generate-speech")
async def generate_speech(request: SpeechRequest):
    """
    Generate speech from text using Amazon Polly
    """
    logging.info(f"Received speech generation request with text: {request.text}")
    
    try:
        # Check if audio is already cached
        cached_audio = get_cached_audio(request.text)
        if cached_audio:
            logging.info("Using cached audio")
            return {
                "audio": cached_audio,
                "format": "mp3",
                "status": "success",
                "cached": True
            }
        
        # If not cached, generate new audio
        polly_client = boto3.client('polly', region_name='us-east-1')
        
        logging.info(f"Calling Amazon Polly with text: {request.text}")
        response = polly_client.synthesize_speech(
            Engine='neural',  # 使用神经语音引擎获得更自然的语音
            Text=request.text,
            OutputFormat='mp3',
            VoiceId='Joanna',  # 可以根据需要选择不同的声音
            LanguageCode='en-US'
        )
        logging.info("Amazon Polly API call successful")
        
        # 返回音频流的base64编码
        if "AudioStream" in response:
            audio_stream = response["AudioStream"].read()
            
            # Save to cache
            save_audio_to_cache(request.text, audio_stream)
            
            audio_base64 = base64.b64encode(audio_stream).decode('utf-8')
            logging.info(f"Audio generated successfully, base64 length: {len(audio_base64)}")
            return {
                "audio": audio_base64,
                "format": "mp3",
                "status": "success",
                "cached": False
            }
        else:
            logging.error("AudioStream not found in Polly response")
            raise HTTPException(status_code=500, detail="Failed to generate speech")
    except Exception as e:
        logging.error(f"Error generating speech: {str(e)}")
        # 在开发环境中，返回错误详情
        return {"message": f"语音生成失败: {str(e)}", "status": "error"}

# Function to call Amazon Bedrock Claude
def call_bedrock_claude(words: List[str]) -> Dict[str, Any]:
    """
    Call Amazon Bedrock Claude to process words
    
    1. Format the prompt with the words
    2. Call the Bedrock API with the prompt
    3. Parse the response JSON
    4. Return the processed words
    """
    try:
        bedrock_runtime = boto3.client(
            service_name='bedrock-runtime',
            region_name='us-east-1'
        )
        
        # Format the prompt for Claude
        prompt = f"""
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

        ## Word List
        {", ".join(words)}

        ## Output Format
        Your response MUST follow this exact JSON structure:
        {{"words": [
        {{
        "word": "target_word",
        "phonetic": "phonetic_transcription",
        "meaning": "chinese_meaning",
        "examples": [
        {{"en": "Example sentence with the **target_word**.", "zh": "对应的中文翻译"}},
        {{"en": "Another example with the **target_word**.", "zh": "对应的中文翻译"}},
        {{"en": "Final example using the **target_word**.", "zh": "对应的中文翻译"}}
        ]
        }}
        ]
        }}

        Do not include any text outside the JSON structure.
        """
        
        # Prepare request body for Claude model
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4000,
            "temperature": 0.5,
            "top_p": 0.9,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        # Call Bedrock Runtime API
        response = bedrock_runtime.invoke_model(
            modelId='anthropic.claude-3-sonnet-20240229-v1:0',  # Use the latest Claude model available
            body=json.dumps(request_body),
            contentType='application/json',
            accept='application/json'
        )
        
        # Parse response
        response_body = json.loads(response['body'].read().decode('utf-8'))
        
        # Extract the completion from the response
        completion = response_body.get('content', [{}])[0].get('text', '{}')
        
        # Parse the JSON from the completion
        try:
            result = json.loads(completion)
            return result
        except json.JSONDecodeError:
            logging.error("Failed to parse JSON from Claude response")
            # Fall back to mock data
    except Exception as e:
        logging.error(f"Error calling Bedrock: {str(e)}")
        
    # Return mock data if API call fails
    result = {"words": []}
    for word in words:
        word_lower = word.lower()
        if word_lower in MOCK_DATA:
            result["words"].append({
                "word": word,
                "phonetic": MOCK_DATA[word_lower]["phonetic"],
                "meaning": MOCK_DATA[word_lower]["meaning"],
                "examples": MOCK_DATA[word_lower]["examples"]
            })
        else:
            result["words"].append({
                "word": word,
                "phonetic": f"/ˈmɒk/",
                "meaning": f"{word}的中文含义",
                "examples": [
                    {"en": f"This is an example with **{word}**.", "zh": f"这是一个包含{word}的例句。"},
                    {"en": f"She used the **{word}** effectively.", "zh": f"她有效地使用了{word}。"},
                    {"en": f"Learning about **{word}** is interesting.", "zh": f"学习关于{word}的知识很有趣。"},
                ]
            })
    
    return result

# DynamoDB functions
def get_dynamodb_client():
    """
    Get a DynamoDB client
    """
    return boto3.resource(
        'dynamodb',
        region_name='us-east-1'
    )

def create_wordlist_table_if_not_exists():
    """
    Create the WordLists table if it doesn't exist
    """
    try:
        dynamodb = get_dynamodb_client()
        
        # Check if table exists
        existing_tables = dynamodb.meta.client.list_tables()['TableNames']
        if 'WordLists' not in existing_tables:
            table = dynamodb.create_table(
                TableName='WordLists',
                KeySchema=[
                    {
                        'AttributeName': 'id',
                        'KeyType': 'HASH'  # Partition key
                    }
                ],
                AttributeDefinitions=[
                    {
                        'AttributeName': 'id',
                        'AttributeType': 'S'
                    },
                    {
                        'AttributeName': 'userId',
                        'AttributeType': 'S'
                    }
                ],
                GlobalSecondaryIndexes=[
                    {
                        'IndexName': 'UserIdIndex',
                        'KeySchema': [
                            {
                                'AttributeName': 'userId',
                                'KeyType': 'HASH'
                            }
                        ],
                        'Projection': {
                            'ProjectionType': 'ALL'
                        },
                        'ProvisionedThroughput': {
                            'ReadCapacityUnits': 5,
                            'WriteCapacityUnits': 5
                        }
                    }
                ],
                ProvisionedThroughput={
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            )
            
            # Wait for the table to be created
            table.meta.client.get_waiter('table_exists').wait(TableName='WordLists')
            logging.info("WordLists table created successfully")
        else:
            logging.info("WordLists table already exists")
    except Exception as e:
        logging.error(f"Error creating WordLists table: {str(e)}")
        raise

# DynamoDB endpoints
@app.post("/save-wordlist", response_model=WordListResponse)
async def save_wordlist(wordlist_input: WordListInput):
    """
    Save a word list to DynamoDB
    """
    try:
        # Create the table if it doesn't exist
        create_wordlist_table_if_not_exists()
        
        # Get the DynamoDB client
        dynamodb = get_dynamodb_client()
        table = dynamodb.Table('WordLists')
        
        # Generate a unique ID for the word list
        list_id = str(uuid.uuid4())
        current_time = datetime.now().isoformat()
        
        # Create the item to save
        item = {
            'id': list_id,
            'name': wordlist_input.name,
            'words': [word.dict() for word in wordlist_input.words],
            'userId': wordlist_input.userId,
            'createdAt': current_time,
            'updatedAt': current_time
        }
        
        # Save the item to DynamoDB
        table.put_item(Item=item)
        
        # Return the saved item
        return WordListResponse(
            id=list_id,
            name=wordlist_input.name,
            words=wordlist_input.words,
            userId=wordlist_input.userId,
            createdAt=current_time,
            updatedAt=current_time
        )
    except Exception as e:
        logging.error(f"Error saving word list: {str(e)}")
        raise HTTPException(status_code=500, detail=f"保存单词列表时出错: {str(e)}")

@app.get("/get-wordlists")
async def get_wordlists(userId: str = Query(..., description="User ID")):
    """
    Get all word lists for a user from DynamoDB
    """
    try:
        # Create the table if it doesn't exist
        create_wordlist_table_if_not_exists()
        
        # Get the DynamoDB client
        dynamodb = get_dynamodb_client()
        table = dynamodb.Table('WordLists')
        
        # Query the table for the user's word lists
        response = table.query(
            IndexName='UserIdIndex',
            KeyConditionExpression=boto3.dynamodb.conditions.Key('userId').eq(userId)
        )
        
        # Convert the DynamoDB items to WordListResponse objects
        wordlists = []
        for item in response.get('Items', []):
            # Convert the words from DynamoDB format to Word objects
            words = []
            for word_data in item.get('words', []):
                examples = []
                for example_data in word_data.get('examples', []):
                    examples.append(Example(
                        en=example_data.get('en', ''),
                        zh=example_data.get('zh', '')
                    ))
                
                words.append(Word(
                    word=word_data.get('word', ''),
                    phonetic=word_data.get('phonetic', ''),
                    meaning=word_data.get('meaning', ''),
                    examples=examples
                ))
            
            wordlists.append({
                'id': item.get('id', ''),
                'name': item.get('name', ''),
                'words': words,
                'userId': item.get('userId', ''),
                'createdAt': item.get('createdAt', ''),
                'updatedAt': item.get('updatedAt', '')
            })
        
        return {'wordlists': wordlists}
    except Exception as e:
        logging.error(f"Error getting word lists: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取单词列表时出错: {str(e)}")

@app.get("/get-wordlist/{list_id}")
async def get_wordlist(list_id: str):
    """
    Get a specific word list from DynamoDB
    """
    try:
        # Create the table if it doesn't exist
        create_wordlist_table_if_not_exists()
        
        # Get the DynamoDB client
        dynamodb = get_dynamodb_client()
        table = dynamodb.Table('WordLists')
        
        # Get the word list from DynamoDB
        response = table.get_item(Key={'id': list_id})
        
        # Check if the item exists
        if 'Item' not in response:
            raise HTTPException(status_code=404, detail=f"单词列表不存在: {list_id}")
        
        item = response['Item']
        
        # Convert the words from DynamoDB format to Word objects
        words = []
        for word_data in item.get('words', []):
            examples = []
            for example_data in word_data.get('examples', []):
                examples.append(Example(
                    en=example_data.get('en', ''),
                    zh=example_data.get('zh', '')
                ))
            
            words.append(Word(
                word=word_data.get('word', ''),
                phonetic=word_data.get('phonetic', ''),
                meaning=word_data.get('meaning', ''),
                examples=examples
            ))
        
        # Return the word list
        return WordListResponse(
            id=item.get('id', ''),
            name=item.get('name', ''),
            words=words,
            userId=item.get('userId', ''),
            createdAt=item.get('createdAt', ''),
            updatedAt=item.get('updatedAt', '')
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting word list: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取单词列表时出错: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
