import React, { useState } from 'react';
import { CHAT_TEXT } from '../../constants/dictionaries';
import './ChatBall.css';

interface ChatBallProps {
  ballRef: React.RefObject<HTMLDivElement>;
  handleBallClick: () => void;
  handleMouseDown: (e: React.MouseEvent) => void;
}

const ChatBall: React.FC<ChatBallProps> = ({ 
  ballRef, 
  handleBallClick, 
  handleMouseDown 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [mouseDownTime, setMouseDownTime] = useState(0);

  const handleMouseDownEvent = (e: React.MouseEvent) => {
    setIsDragging(false);
    setMouseDownTime(Date.now());
    handleMouseDown(e);
  };

  const handleClickEvent = () => {
    // 如果鼠标按下和释放的时间间隔小于 200ms，且没有拖动，则认为是点击
    if (Date.now() - mouseDownTime < 200 && !isDragging) {
      handleBallClick();
    }
  };

  const handleMouseMove = () => {
    setIsDragging(true);
  };

  return (
    <div 
      ref={ballRef} 
      className="chat-ball" 
      onClick={handleClickEvent}
      onMouseDown={handleMouseDownEvent}
      onMouseMove={handleMouseMove}
    >
      <div className="ball-content">
        <span className="ball-icon">{CHAT_TEXT.ball.icon}</span>
        <span className="ball-text">{CHAT_TEXT.ball.text}</span>
      </div>
    </div>
  );
};

export default ChatBall; 