import React, { useEffect, useRef, memo, useState } from 'react';
import { ChatMessage } from '../../api/types';
import { CHAT_TEXT } from '../../constants/dictionaries';
import ConversationCard from './ConversationCard';
import './ChatWindow.css';

interface ChatWindowProps {
  headerRef: React.RefObject<HTMLDivElement>;
  messages: ChatMessage[];
  error: string | null;
  isLoading: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSubmit: () => void;
  handleClose: () => void;
  handleHeaderMouseDown: (e: React.MouseEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  headerRef,
  messages,
  error,
  isLoading,
  inputValue,
  setInputValue,
  handleSubmit,
  handleClose,
  handleHeaderMouseDown,
  messagesEndRef,
  inputRef
}) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 将消息分组为对话单元
  const groupMessages = () => {
    const conversations = [];
    let currentConversation = [];
    let userMessageFound = false;

    // 遍历所有消息，按照用户-助手对话进行分组
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      
      // 如果是用户消息，开始新的对话
      if (msg.role === 'user') {
        // 如果已经有对话内容，保存当前对话
        if (currentConversation.length > 0) {
          conversations.push([...currentConversation]);
          currentConversation = [];
        }
        currentConversation.push(msg);
        userMessageFound = true;
      } 
      // 如果是助手消息，添加到当前对话
      else if (msg.role === 'assistant') {
        // 如果没有找到用户消息，创建一个空的对话
        if (!userMessageFound && currentConversation.length === 0) {
          conversations.push([msg]);
        } else {
          currentConversation.push(msg);
        }
      }
    }
    
    // 添加最后一个对话
    if (currentConversation.length > 0) {
      conversations.push(currentConversation);
    }
    
    return conversations;
  };
  
  const conversationGroups = groupMessages();

  return (
    <div className="chat-container">
      <div 
        ref={headerRef} 
        className="chat-header" 
        onMouseDown={handleHeaderMouseDown}
      >
        <h2>{CHAT_TEXT.title}</h2>
        <button className="minimize-button" onClick={handleClose}>
          <span className="minimize-icon">—</span>
        </button>
      </div>

      <div className="messages" ref={messagesContainerRef}>
        {conversationGroups.map((conversation, groupIndex) => (
          <ConversationCard
            key={`conversation-${groupIndex}`}
            messages={conversation}
            isTyping={isLoading && groupIndex === conversationGroups.length - 1}
          />
        ))}
        
        {error && (
          <div className="message error">
            <div className="message-content">{error}</div>
          </div>
        )}
        
        <div className="message-buffer" ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <div className="textarea-wrapper">
          <textarea
            className="send-textarea"
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={CHAT_TEXT.input.placeholder}
            rows={1}
            disabled={isLoading}
          />
        </div>
        <button 
          className="send-button"
          onClick={handleSubmit}
          disabled={!inputValue.trim() || isLoading}
        >
          {CHAT_TEXT.input.send}
        </button>
      </div>
    </div>
  );
};

export default memo(ChatWindow);
