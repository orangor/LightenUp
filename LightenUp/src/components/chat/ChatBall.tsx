import React, { useState } from 'react';
import { CHAT_TEXT } from '../../constants/dictionaries';
import './ChatBall.css';

interface ChatBallProps {
  ballRef: React.RefObject<HTMLDivElement>;
  handleBallClick: () => void;
  handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}

const ChatBall: React.FC<ChatBallProps> = ({ 
  ballRef, 
  handleBallClick, 
  handlePointerDown 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [mouseDownTime, setMouseDownTime] = useState(0);

  const handlePointerDownEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    setMouseDownTime(Date.now());
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePointerDown(e);
  };

  const handleClickEvent = () => {
    // 如果鼠标按下和释放的时间间隔小于 200ms，且没有拖动，则认为是点击
    if (Date.now() - mouseDownTime < 200 && !isDragging) {
      handleBallClick();
    }
  };

  const handlePointerMove = () => {
    setIsDragging(true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div 
      ref={ballRef} 
      className="chat-ball" 
      onClick={handleClickEvent}
      onPointerDown={handlePointerDownEvent}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="ball-content">
        <span className="ball-icon">{CHAT_TEXT.ball.icon}</span>
        <span className="ball-text">{CHAT_TEXT.ball.text}</span>
      </div>
    </div>
  );
};

export default ChatBall; 
