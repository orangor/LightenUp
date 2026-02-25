import React, { memo } from 'react';
import './ConversationCard.css';
import { ChatMessage } from '../../api/types';

interface ConversationCardProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

/**
 * 对话卡片组件，用于显示一组相关的消息，包括思考过程和回答内容
 */
const ConversationCard = memo(({ messages, isTyping }: ConversationCardProps) => {
  // 分离思考消息和内容消息，确保只显示有效的字符串内容
  const reasoningMessages = messages.filter(msg => {
    return msg.role === 'assistant' && 
           msg.type === 'reasoning' && 
           msg.content && 
           typeof msg.content === 'string' && 
           msg.content !== '[object Object]';
  });
  
  const contentMessages = messages.filter(msg => {
    return msg.role === 'assistant' && 
           (msg.type === 'content' || !msg.type) && 
           msg.content && 
           typeof msg.content === 'string' && 
           msg.content !== '[object Object]';
  });
  
  // 获取用户消息，确保内容是有效的字符串
  const userMessage = messages.find(msg => {
    return msg.role === 'user' && 
           msg.content && 
           typeof msg.content === 'string' && 
           msg.content !== '[object Object]';
  });
  
  // 判断是否有思考内容
  const hasReasoning = reasoningMessages.length > 0;
  
  return (
    <div className="conversation-card">
      {/* 用户消息 */}
      {userMessage && (
        <div className="user-message">
          <div className="message-content">
            {userMessage.content}
          </div>
        </div>
      )}
      
      {/* 助手回复区域 */}
      <div className="assistant-response">
        {/* 思考过程区域 */}
        {(hasReasoning || isTyping) && (
          <div className="reasoning-section">
            <div className="reasoning-header">
              <span className="reasoning-icon">💭</span>
              <span className="reasoning-label">思考过程</span>
            </div>
            <div className="reasoning-content">
              {reasoningMessages.map((msg, index) => (
                <div key={index} className="reasoning-message">
                  {msg.content}
                </div>
              ))}
              {isTyping && !hasReasoning && (
                <div className="reasoning-message">
                  <span className="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 回答内容区域 */}
        {contentMessages.length > 0 && (
          <div className={`content-section ${(hasReasoning || isTyping) ? 'has-reasoning' : ''}`}>
            {contentMessages.map((msg, index) => (
              <div key={index} className="content-message">
                {msg.content}
                {isTyping && index === contentMessages.length - 1 && (
                  <span className="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default ConversationCard;