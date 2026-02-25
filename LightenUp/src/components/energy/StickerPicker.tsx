import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnergyType, Sticker } from '../../api/energyTypes';
import './StickerPicker.scss';

interface StickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  energyType: EnergyType | null;
  stickers: Sticker[];
  onSelect: (sticker: Sticker) => void;
}

const StickerPicker: React.FC<StickerPickerProps> = ({
  isOpen,
  onClose,
  energyType,
  stickers,
  onSelect,
}) => {
  // 筛选当前能量类型下的贴纸
  const filteredStickers = stickers.filter(
    (s) => energyType && s.energy_type_id === energyType.id
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="sticker-picker-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="sticker-picker-container"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="sticker-picker-header">
              <h3 className="header-title">
                选择你的{energyType?.name}表情
              </h3>
              <button
                onClick={onClose}
                className="close-btn"
              >
                ✕
              </button>
            </div>

            <div className="sticker-grid">
              {filteredStickers.map((sticker) => (
                <motion.button
                  key={sticker.id}
                  className="sticker-item"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelect(sticker)}
                >
                  <div className="sticker-icon">{sticker.sticker_url}</div>
                  <span className="sticker-name">
                    {sticker.sticker_name}
                  </span>
                </motion.button>
              ))}
            </div>
            
            {filteredStickers.length === 0 && (
              <div className="empty-state">
                暂无相关贴纸
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StickerPicker;
