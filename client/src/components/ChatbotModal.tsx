import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, Loader2, FileText } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ filename: string; chunkIndex: number }>;
  timestamp: Date;
}

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatbotModal({ isOpen, onClose }: ChatbotModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [indexedDocs, setIndexedDocs] = useState<Array<{ filename: string; chunks: number }>>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      initializeRAG();
      loadIndexedDocuments();
    }
  }, [isOpen]);

  const initializeRAG = async () => {
    try {
      const response = await fetch('/api/rag/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (response.ok) {
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('RAG 초기화 실패:', error);
    }
  };

  const loadIndexedDocuments = async () => {
    try {
      const response = await fetch('/api/rag/documents');
      const data = await response.json();
      if (response.ok) {
        setIndexedDocs(data.documents || []);
      }
    } catch (error) {
      console.error('문서 목록 로드 실패:', error);
    }
  };

  const addMessage = (role: 'user' | 'assistant', content: string, sources?: Array<{ filename: string; chunkIndex: number }>) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      sources,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const question = inputMessage.trim();
    setInputMessage('');
    addMessage('user', question);
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/rag/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });

      const data = await response.json();
      
      if (response.ok) {
        addMessage('assistant', data.answer, data.sources);
      } else {
        addMessage('assistant', `오류: ${data.error}`);
      }
    } catch (error) {
      console.error('질문 처리 오류:', error);
      addMessage('assistant', '답변을 생성하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-semibold">매뉴얼 챗봇</h2>
              <p className="text-xs text-indigo-100">
                {indexedDocs.length > 0 
                  ? `${indexedDocs.length}개 매뉴얼 학습됨` 
                  : '매뉴얼을 인덱싱하면 질문할 수 있습니다'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 rounded-lg p-2 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  매뉴얼에 대해 질문하세요
                </h3>
                <p className="text-sm text-gray-500">
                  업로드된 매뉴얼 내용을 바탕으로 정확한 답변을 제공합니다
                </p>
                {indexedDocs.length > 0 && (
                  <div className="mt-4 space-y-1">
                    <p className="text-xs text-gray-400">학습된 매뉴얼:</p>
                    {indexedDocs.map((doc, idx) => (
                      <div key={idx} className="text-xs text-gray-600 flex items-center justify-center">
                        <FileText className="w-3 h-3 mr-1" />
                        {doc.filename}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white shadow-sm border border-gray-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">참조 출처:</p>
                      <div className="space-y-1">
                        {message.sources.map((source, idx) => (
                          <div key={idx} className="text-xs text-gray-600 flex items-start">
                            <span className="mr-1">•</span>
                            <span>{source.filename}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white shadow-sm border border-gray-200 rounded-2xl px-4 py-3 flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span className="text-sm text-gray-600">답변 생성 중...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t bg-white p-4 rounded-b-2xl">
          <div className="flex space-x-2">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={indexedDocs.length > 0 ? "질문을 입력하세요..." : "먼저 매뉴얼을 인덱싱해주세요"}
              rows={1}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Shift + Enter로 줄바꿈 • Enter로 전송
          </p>
        </div>
      </div>
    </div>
  );
}
