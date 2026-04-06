import React, { memo, useCallback, useMemo } from 'react';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import { message } from 'antd';
import 'highlight.js/styles/github-dark.css'; // 你可以选择其他主题
import './ConversationCard.scss';
import { ChatMessage } from '../../api/types';

const md: MarkdownIt = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    const language = lang && hljs.getLanguage(lang) ? lang : 'text';
    const highlightedCode = language !== 'text'
      ? hljs.highlight(str, { language, ignoreIllegals: true }).value
      : md.utils.escapeHtml(str);

    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<div class="md-code-block"><div class="md-code-header"><span class="md-code-language">${md.utils.escapeHtml(lang)}</span></div><pre class="hljs"><code>${highlightedCode}</code></pre></div>`;
      } catch (__) {}
    }

    return `<div class="md-code-block"><div class="md-code-header"><span class="md-code-language">${language}</span></div><pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre></div>`;
  }
});

// 让链接在新标签页打开
const defaultRender = md.renderer.rules.link_open || function(tokens: any[], idx: number, options: any, env: any, self: any) {
  return self.renderToken(tokens, idx, options);
};
md.renderer.rules.link_open = function (tokens: any[], idx: number, options: any, env: any, self: any) {
  const aIndex = tokens[idx].attrIndex('target');
  const relIndex = tokens[idx].attrIndex('rel');

  if (aIndex < 0) {
    tokens[idx].attrPush(['target', '_blank']);
  } else {
    // @ts-ignore
    tokens[idx].attrs[aIndex][1] = '_blank';
  }

  if (relIndex < 0) {
    tokens[idx].attrPush(['rel', 'noopener noreferrer']);
  } else {
    // @ts-ignore
    tokens[idx].attrs[relIndex][1] = 'noopener noreferrer';
  }

  return defaultRender(tokens, idx, options, env, self);
};

const tableOpenRender = md.renderer.rules.table_open || function(tokens: any[], idx: number, options: any, env: any, self: any) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.table_open = function (tokens: any[], idx: number, options: any, env: any, self: any) {
  return `<div class="md-table-wrapper">${tableOpenRender(tokens, idx, options, env, self)}`;
};

const tableCloseRender = md.renderer.rules.table_close || function(tokens: any[], idx: number, options: any, env: any, self: any) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.table_close = function (tokens: any[], idx: number, options: any, env: any, self: any) {
  return `${tableCloseRender(tokens, idx, options, env, self)}</div>`;
};

interface ConversationCardProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

const getValidMessageContent = (content?: ChatMessage['content'] | null) => {
  if (!content || typeof content !== 'string' || content === '[object Object]') {
    return '';
  }

  return content;
};

const copyTextToClipboard = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};

const renderMarkdown = (content: string) => {
  return DOMPurify.sanitize(md.render(content), {
    ADD_ATTR: ['target', 'rel']
  });
};

/**
 * 对话卡片组件，用于显示一组相关的消息，包括思考过程和回答内容
 */
const ConversationCard = memo(({ messages, isTyping }: ConversationCardProps) => {
  const reasoningMessages = messages.filter(msg => {
    return msg.role === 'assistant' &&
           msg.type === 'reasoning' &&
           Boolean(getValidMessageContent(msg.content));
  });

  const contentMessages = messages.filter(msg => {
    return msg.role === 'assistant' &&
           (msg.type === 'content' || !msg.type) &&
           Boolean(getValidMessageContent(msg.content));
  });

  const userMessage = messages.find(msg => {
    return msg.role === 'user' &&
           Boolean(getValidMessageContent(msg.content));
  });

  const hasReasoning = reasoningMessages.length > 0;

  const renderedReasoningMessages = useMemo(() => {
    return reasoningMessages.map(msg => renderMarkdown(getValidMessageContent(msg.content)));
  }, [reasoningMessages]);

  const renderedContentMessages = useMemo(() => {
    return contentMessages.map(msg => renderMarkdown(getValidMessageContent(msg.content)));
  }, [contentMessages]);

  const copyContentText = useMemo(() => {
    return contentMessages
      .map(msg => getValidMessageContent(msg.content).trim())
      .filter(Boolean)
      .join('\n\n');
  }, [contentMessages]);

  const handleCopyContent = useCallback(async () => {
    if (!copyContentText) {
      return;
    }

    try {
      await copyTextToClipboard(copyContentText);
      message.success('已复制当前对话内容');
    } catch {
      message.error('复制失败，请手动复制');
    }
  }, [copyContentText]);
  
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
      
      <div className="assistant-response">
        {copyContentText && (
          <div className="conversation-actions">
            <button type="button" className="copy-all-button" onClick={handleCopyContent}>
              复制内容
            </button>
          </div>
        )}

        {(hasReasoning || isTyping) && (
          <div className="reasoning-section">
            <div className="reasoning-header">
              <span className="reasoning-icon">💭</span>
              <span className="reasoning-label">思考过程</span>
            </div>
            <div className="reasoning-content">
              {renderedReasoningMessages.map((html, index) => (
                <div 
                  key={index} 
                  className="reasoning-message markdown-body"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
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
            {renderedContentMessages.map((html, index) => (
              <div key={index} className="content-message markdown-body">
                <div dangerouslySetInnerHTML={{ __html: html }} />
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
