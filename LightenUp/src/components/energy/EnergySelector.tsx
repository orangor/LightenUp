import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnergyType, Sticker } from '../../api/energyTypes';
import './EnergySelector.scss';

interface EnergySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  types: EnergyType[];
  stickers: Sticker[];
  onSelect: (type: EnergyType, sticker: Sticker) => void;
}

const EnergySelector: React.FC<EnergySelectorProps> = ({
  isOpen,
  onClose,
  types,
  stickers,
  onSelect,
}) => {
  const handleSelect = (type: EnergyType) => {
    // 尝试查找该类型下的第一个贴纸
    const validSticker = stickers.find((s) => s.energy_type_id === type.id);
    
    // 如果没有配置贴纸，构造一个基于 EnergyType 的虚拟贴纸
    // 注意：id=0 在后端入库时可能需要注意，但由于没有外键约束，暂时可行
    // 理想情况是后端数据库应该初始化贴纸数据
    const stickerToUse: Sticker = validSticker || {
      id: 0, // 虚拟ID
      energy_type_id: type.id,
      sticker_url: type.icon_code, // 使用 Emoji 作为贴纸 URL/内容
      sticker_name: type.name,
      is_active: true
    };

    onSelect(type, stickerToUse);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            className="selector-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* 面板内容 */}
          <motion.div
            className="selector-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="selector-header">
              <h3 className="header-title">选择此刻心情</h3>
              <button
                onClick={onClose}
                className="close-btn"
              >
                ✕
              </button>
            </div>

            <div className="energy-grid">
              {types.map((type) => (
                <motion.button
                  key={type.id}
                  onClick={() => handleSelect(type)}
                  className="energy-item"
                  whileTap={{ scale: 0.9 }}
                >
                  <div 
                    className="energy-icon-wrapper"
                    style={{ backgroundColor: `${type.color_hex}20` }} // 浅色背景
                  >
                    {type.icon_code}
                  </div>
                  <span className="energy-name">
                    {type.name.split('/')[0]}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EnergySelector;
