import { useState, useRef, useEffect } from 'react';
import { StreamService } from '../../api';
import type { ChatMessage } from '../../api/types';
import { CHAT_TEXT, AI_SYSTEM_PROMPT } from '../../constants/dictionaries';
import './Chat.css';
import ChatBall from './ChatBall';
import ChatWindow from './ChatWindow';
// import { ChatAPI } from '../../api/chatApi';

// 系统消息配置
const SYSTEM_MESSAGE: ChatMessage = {
  role: 'system' as const,
  content: AI_SYSTEM_PROMPT
};

const BALL_SIZE = { width: 80, height: 60 };
const CHAT_SIZE = { width: 760, height: 700 };
const BUFFER = 5;
const MOBILE_BREAKPOINT = 768;
const MOBILE_MARGIN = 16;

const isMobileViewport = () => window.innerWidth <= MOBILE_BREAKPOINT;

const getExpandedSize = () => {
  if (!isMobileViewport()) {
    return CHAT_SIZE;
  }

  return {
    width: Math.min(window.innerWidth - MOBILE_MARGIN * 2, 420),
    height: Math.min(window.innerHeight - MOBILE_MARGIN * 2, 640)
  };
};

const getSurfaceSize = (expanded: boolean) => (expanded ? getExpandedSize() : BALL_SIZE);

const Chat: React.FC = () => {
  // 状态管理
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState(() => ({
    x: 20,
    y: Math.min(20, window.innerHeight - 60)
  }));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 拖拽相关状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // DOM 引用
  const ballRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const calculateValidPosition = (pos: { x: number, y: number }, expanded: boolean) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const { width, height } = getSurfaceSize(expanded);
    
    return {
      x: Math.max(BUFFER, Math.min(pos.x, windowWidth - width - BUFFER)),
      y: Math.max(BUFFER, Math.min(pos.y, windowHeight - height - BUFFER))
    };
  };

  const handleExpandToggle = (expand: boolean) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const collapsedSize = getSurfaceSize(false);
    const expandedSize = getSurfaceSize(true);
    
    if (expand) {
      const ballCenter = {
        x: windowWidth - position.x - collapsedSize.width / 2,
        y: windowHeight - position.y - collapsedSize.height / 2
      };
      
      const newPos = calculateValidPosition({
        x: windowWidth - ballCenter.x - expandedSize.width / 2,
        y: windowHeight - ballCenter.y - expandedSize.height / 2
      }, true);
      
      setPosition(newPos);
      setIsExpanded(true);
    } else {
      const chatCenter = {
        x: windowWidth - position.x - expandedSize.width / 2,
        y: windowHeight - position.y - expandedSize.height / 2
      };
      
      const newPos = calculateValidPosition({
        x: windowWidth - chatCenter.x - collapsedSize.width / 2,
        y: windowHeight - chatCenter.y - collapsedSize.height / 2
      }, false);
      
      setPosition(newPos);
      setIsExpanded(false);
    }
  };

  const sendMessage = (message: string) => {
    const newUserMessage: ChatMessage = { role: 'user', content: message };
    
    // 构建发送到API的消息，确保没有连续的相同角色消息
    // 首先添加系统消息
    const apiMessages: ChatMessage[] = [SYSTEM_MESSAGE];
    
    // 然后添加历史消息，但过滤掉思考类型的消息和空内容消息
    // 同时确保不会有连续的相同角色消息
    let lastRole = 'system';
    messages.forEach(msg => {
      // 跳过思考类型的消息，只保留用户消息和助手的内容消息
      if (msg.type === 'reasoning') return;
      // 跳过空内容的消息
      if (!msg.content.trim()) return;
      // 跳过与上一条消息相同角色的消息
      if (msg.role === lastRole) return;
      
      apiMessages.push(msg);
      lastRole = msg.role;
    });
    
    // 最后添加新的用户消息，确保不会有连续的用户消息
    if (lastRole !== 'user') {
      apiMessages.push(newUserMessage);
    }
    
    // 用于UI显示的完整消息列表
    const fullMessages = apiMessages;
    
    // 批量更新状态
    const assistantMessage: ChatMessage = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, newUserMessage, assistantMessage]);
    setError(null);
    setIsLoading(true);

    // 使用队列来存储接收到的内容
    let contentQueue: (string | MessageChunk)[] = [];
    let isProcessing = false;
    let updateTimeout: NodeJS.Timeout;

    // 处理队列中的内容
    const processQueue = () => {
      if (isProcessing || contentQueue.length === 0) return;
      
      isProcessing = true;
      const chunk = contentQueue.shift() || '';
      
      // 确保chunk内容是有效的字符串
      const getValidContent = (content: any): string => {
        if (typeof content === 'string') return content;
        if (content && typeof content === 'object') {
          if (typeof content.content === 'string') return content.content;
          return '';
        }
        return '';
      };

      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage?.role === 'assistant') {
          // 处理可能带有type属性的chunk
          if (typeof chunk === 'object' && chunk.content) {
            const validContent = getValidContent(chunk.content);
            // 如果是新的思考内容，且上一条不是思考消息，创建新消息
            if (chunk.type === 'reasoning' && lastMessage.type !== 'reasoning') {
              if (validContent) {
                newMessages.push({
                  role: 'assistant',
                  content: validContent,
                  type: 'reasoning'
                });
              }
            } 
            // 如果是思考内容，且上一条也是思考消息，合并内容
            else if (chunk.type === 'reasoning' && lastMessage.type === 'reasoning') {
              if (validContent) {
                newMessages[newMessages.length - 1] = {
                  ...lastMessage,
                  content: lastMessage.content + ' ' + validContent
                };
              }
            }
            // 如果是内容消息，且上一条是思考消息，创建新消息
            else if (chunk.type === 'content' && lastMessage.type === 'reasoning') {
              if (validContent) {
                newMessages.push({
                  role: 'assistant',
                  content: validContent,
                  type: 'content'
                });
              }
            }
            // 其他情况，追加到当前消息
            else if (validContent) {
              newMessages[newMessages.length - 1] = {
                ...lastMessage,
                content: lastMessage.content + validContent,
                type: chunk.type || lastMessage.type
              };
            }
          } else {
            // 处理纯文本内容，保持现有类型
            const validContent = getValidContent(chunk);
            if (validContent) {
              newMessages[newMessages.length - 1] = {
                ...lastMessage,
                content: lastMessage.content + validContent
              };
            }
          }
        }
        return newMessages;
      });

      // 设置一个小延迟来模拟打字效果
      updateTimeout = setTimeout(() => {
        isProcessing = false;
        processQueue(); // 处理队列中的下一个内容
      }, 16); // 约一帧的时间
    };

    const subscription = StreamService.chatStream(fullMessages).subscribe({
      next: (chunk: any) => {
        // 处理可能带有type属性的chunk
        if (typeof chunk === 'object' && chunk.content) {
          // 将新内容添加到队列，保留type属性
          contentQueue.push(chunk);
        } else {
          // 处理纯文本内容
          contentQueue.push(chunk);
        }
        // 开始处理队列
        processQueue();
      },
      error: (error) => {
        setError(error instanceof Error ? error.message : CHAT_TEXT.error.tryAgain);
        setIsLoading(false);
      },
      complete: () => {
        // 确保所有内容都已处理
        const processRemaining = () => {
          if (contentQueue.length > 0) {
            processQueue();
            setTimeout(processRemaining, 16);
          } else {
            setIsLoading(false);
          }
        };
        processRemaining();
      }
    });

    return () => {
      clearTimeout(updateTimeout);
      subscription.unsubscribe();
    };
  };

  const handleSubmit = () => {
    if (!inputValue.trim() || isLoading) return;
    const messageToSend = inputValue;
    setInputValue('');
    sendMessage(messageToSend);
  };

  const startDragging = (clientX: number, clientY: number, rect: DOMRect) => {
    setIsDragging(true);
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top
    });
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;

      if (e.cancelable) {
        e.preventDefault();
      }

      const { width, height } = getSurfaceSize(isExpanded);
      const maxRight = Math.max(BUFFER, window.innerWidth - width - BUFFER);
      const maxBottom = Math.max(BUFFER, window.innerHeight - height - BUFFER);

      const newRight = Math.min(
        maxRight,
        Math.max(BUFFER, window.innerWidth - e.clientX - dragOffset.x)
      );
      const newBottom = Math.min(
        maxBottom,
        Math.max(BUFFER, window.innerHeight - e.clientY - dragOffset.y)
      );

      setPosition({ x: newRight, y: newBottom });
    };

    const handlePointerUp = () => {
      if (!isDragging) return;

      setPosition(prev => calculateValidPosition(prev, isExpanded));
      setIsDragging(false);
    };

    const handleResize = () => {
      setPosition(prev => calculateValidPosition(prev, isExpanded));
    };

    document.addEventListener('pointermove', handlePointerMove, { passive: false });
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDragging, dragOffset, isExpanded]);

  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => calculateValidPosition(prev, isExpanded));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded]);

  const expandedSize = isExpanded ? getExpandedSize() : null;
  const wrapperStyle = {
    right: `${position.x}px`,
    bottom: `${position.y}px`,
    width: expandedSize ? `${expandedSize.width}px` : undefined,
    height: expandedSize ? `${expandedSize.height}px` : undefined,
    transition: isDragging ? 'none' : 'all 0.3s ease'
  };

  return (
    <div className={`chat-wrapper ${isExpanded ? 'expanded' : ''}`} style={wrapperStyle}>
      {!isExpanded ? (
        <ChatBall 
          ballRef={ballRef}
          handleBallClick={() => handleExpandToggle(true)}
          handlePointerDown={(e) => {
            if (ballRef.current) {
              e.preventDefault();
              const rect = ballRef.current.getBoundingClientRect();
              startDragging(e.clientX, e.clientY, rect);
            }
          }}
        />
      ) : (
        <ChatWindow 
          headerRef={headerRef}
          messages={messages}
          error={error}
          isLoading={isLoading}
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSubmit={handleSubmit}
          handleClose={() => handleExpandToggle(false)}
          handleHeaderPointerDown={(e) => {
            if (headerRef.current) {
              e.preventDefault();
              const rect = headerRef.current.getBoundingClientRect();
              startDragging(e.clientX, e.clientY, rect);
            }
          }}
          messagesEndRef={messagesEndRef}
          inputRef={inputRef}
        />
      )}
    </div>
  );
};

export default Chat;

interface MessageChunk {
  content: string;
  type?: 'reasoning' | 'content';
}
