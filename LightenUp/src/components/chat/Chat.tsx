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

// 添加常量定义
const BALL_SIZE = { width: 80, height: 60 };
const CHAT_SIZE = { width: 760, height: 800 };
const BUFFER = 5;

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

  // 计算有效位置的工具函数
  const calculateValidPosition = (pos: { x: number, y: number }, expanded: boolean) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const { width, height } = expanded ? CHAT_SIZE : BALL_SIZE;
    
    return {
      x: Math.max(BUFFER, Math.min(pos.x, windowWidth - width - BUFFER)),
      y: Math.max(BUFFER, Math.min(pos.y, windowHeight - height - BUFFER))
    };
  };

  // 处理展开/收缩状态切换
  const handleExpandToggle = (expand: boolean) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    if (expand) {
      // 从小球展开到聊天窗口
      const ballCenter = {
        x: windowWidth - position.x - BALL_SIZE.width / 2,
        y: windowHeight - position.y - BALL_SIZE.height / 2
      };
      
      // 计算展开后的位置，确保窗口完全在视图内
      const newPos = calculateValidPosition({
        x: windowWidth - ballCenter.x - CHAT_SIZE.width / 2,
        y: windowHeight - ballCenter.y - CHAT_SIZE.height / 2
      }, true);
      
      setPosition(newPos);
      setIsExpanded(true);
    } else {
      // 从聊天窗口收缩到小球
      const chatCenter = {
        x: windowWidth - position.x - CHAT_SIZE.width / 2,
        y: windowHeight - position.y - CHAT_SIZE.height / 2
      };
      
      // 计算收缩后的位置
      const newPos = calculateValidPosition({
        x: windowWidth - chatCenter.x - BALL_SIZE.width / 2,
        y: windowHeight - chatCenter.y - BALL_SIZE.height / 2
      }, false);
      
      setPosition(newPos);
      setIsExpanded(false);
    }
  };

  // 消息处理函数
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

  // 提交处理函数
  const handleSubmit = () => {
    if (!inputValue.trim() || isLoading) return;
    const messageToSend = inputValue;
    setInputValue('');
    sendMessage(messageToSend);
  };

  // 拖拽相关处理
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        if (isExpanded) {
          // 获取窗口尺寸
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;
          const chatWidth = 760;
          const chatHeight = 800;
          
          // 计算新位置
          const x = e.clientX - dragOffset.x;
          const y = e.clientY - dragOffset.y;
          
          // 添加边界缓冲区
          const buffer = 5;
          const maxX = windowWidth - chatWidth - buffer;
          const maxY = windowHeight - chatHeight - buffer;
          
          // 严格限制边界
          const boundedX = Math.max(buffer, Math.min(x, maxX));
          const boundedY = Math.max(buffer, Math.min(y, maxY));
          
          // 计算最终位置
          const finalX = windowWidth - boundedX - chatWidth;
          const finalY = windowHeight - boundedY - chatHeight;
          
          // 确保不会超出屏幕
          if (finalX >= -buffer && 
              finalX <= windowWidth - buffer && 
              finalY >= -buffer && 
              finalY <= windowHeight - buffer) {
            setPosition({
              x: finalX,
              y: finalY
            });
          }
        } else {
          // 小球状态的拖拽处理
          const buffer = 5;
          const maxRight = window.innerWidth - 80 - buffer;
          const maxBottom = window.innerHeight - 60 - buffer;
          
          const newRight = Math.min(
            maxRight,
            Math.max(buffer, window.innerWidth - e.clientX - dragOffset.x)
          );
          const newBottom = Math.min(
            maxBottom,
            Math.max(buffer, window.innerHeight - e.clientY - dragOffset.y)
          );
          
          setPosition({ x: newRight, y: newBottom });
        }
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        // 添加边界检查
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        setPosition(prev => {
          let { x, y } = prev;
          const buffer = 5;
          
          // 展开状态
          if (isExpanded) {
            x = Math.max(buffer, Math.min(x, windowWidth - 760 - buffer));
            y = Math.max(buffer, Math.min(y, windowHeight - 800 - buffer));
          } else {
            // 小球状态
            x = Math.max(buffer, Math.min(x, windowWidth - 80 - buffer));
            y = Math.max(buffer, Math.min(y, windowHeight - 60 - buffer));
          }
          
          return { x, y };
        });
        
        setIsDragging(false);
      }
    };

    // 添加窗口大小变化处理
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const buffer = 5;
      
      setPosition(prev => {
        let { x, y } = prev;
        
        if (isExpanded) {
          x = Math.max(buffer, Math.min(x, windowWidth - 760 - buffer));
          y = Math.max(buffer, Math.min(y, windowHeight - 800 - buffer));
        } else {
          x = Math.max(buffer, Math.min(x, windowWidth - 80 - buffer));
          y = Math.max(buffer, Math.min(y, windowHeight - 60 - buffer));
        }
        
        return { x, y };
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDragging, dragOffset, isExpanded]);

  // 响应式处理
  const isMobile = window.innerWidth <= 768;
  
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile && isExpanded) {
        setPosition({ x: 0, y: 0 });
      } else {
        setPosition(prev => ({
          x: Math.min(prev.x, window.innerWidth - 80),
          y: Math.min(prev.y, window.innerHeight - 60)
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded]);

  // 样式计算
  const wrapperStyle = {
    right: isMobile && isExpanded ? '0' : `${position.x}px`,
    bottom: isMobile && isExpanded ? '0' : `${position.y}px`,
    transition: isDragging ? 'none' : 'all 0.3s ease'
  };

  // 渲染组件
  return (
    <div className={`chat-wrapper ${isExpanded ? 'expanded' : ''}`} style={wrapperStyle}>
      {!isExpanded ? (
        <ChatBall 
          ballRef={ballRef}
          handleBallClick={() => handleExpandToggle(true)}
          handleMouseDown={(e) => {
            if (ballRef.current) {
              setIsDragging(true);
              const rect = ballRef.current.getBoundingClientRect();
              setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
              });
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
          handleHeaderMouseDown={(e) => {
            if (headerRef.current) {
              setIsDragging(true);
              const rect = headerRef.current.getBoundingClientRect();
              setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
              });
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
