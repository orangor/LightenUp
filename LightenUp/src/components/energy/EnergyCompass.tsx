import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EnergyType, Sticker } from '../../api/energyTypes';

interface EnergyCompassProps {
  types: EnergyType[];
  stickers: Sticker[];
  onSelect: (type: EnergyType, sticker: Sticker) => void;
  isOpen: boolean;
  onClose: () => void;
}

const EnergyCompass: React.FC<EnergyCompassProps> = ({
  types,
  stickers,
  onSelect,
  isOpen,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<EnergyType | null>(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  
  // 计算每个扇形的角度
  const anglePerItem = 360 / (types.length || 1);
  const radius = 120; // 罗盘半径

  const handleTypeSelect = (type: EnergyType) => {
    setSelectedType(type);
    setShowStickerPicker(true);
  };

  const handleStickerSelect = (sticker: Sticker) => {
    if (selectedType) {
      onSelect(selectedType, sticker);
      onClose();
    }
  };

  // 生成扇形路径
  const createSectorPath = (index: number, total: number, r: number) => {
    const startAngle = (index * 360) / total;
    const endAngle = ((index + 1) * 360) / total;
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    const x1 = r + r * Math.cos(startRad);
    const y1 = r + r * Math.sin(startRad);
    const x2 = r + r * Math.cos(endRad);
    const y2 = r + r * Math.sin(endRad);
    return `M${r},${r} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`;
  };

  return (
    <>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="relative w-80 h-80">
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 text-white/80 hover:text-white"
            >
              ✕ 关闭
            </button>

            {/* 罗盘主体 */}
            <motion.div
              className="w-full h-full relative"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <svg width="320" height="320" viewBox="0 0 240 240" className="transform rotate-[-30deg]">
                {types.map((type, index) => (
                  <g
                    key={type.id}
                    onClick={() => handleTypeSelect(type)}
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <path
                      d={createSectorPath(index, types.length, 120)}
                      fill={type.color_hex}
                      stroke="white"
                      strokeWidth="2"
                    />
                    {/* 文字标签位置计算 */}
                    <text
                      x={120 + 80 * Math.cos(((index + 0.5) * anglePerItem - 90) * (Math.PI / 180))}
                      y={120 + 80 * Math.sin(((index + 0.5) * anglePerItem - 90) * (Math.PI / 180))}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                      transform={`rotate(${90 + (index + 0.5) * anglePerItem}, ${
                        120 + 80 * Math.cos(((index + 0.5) * anglePerItem - 90) * (Math.PI / 180))
                      }, ${
                        120 + 80 * Math.sin(((index + 0.5) * anglePerItem - 90) * (Math.PI / 180))
                      })`}
                    >
                      {type.name.split('/')[0]}
                    </text>
                  </g>
                ))}
                {/* 中心圆 */}
                <circle cx="120" cy="120" r="30" fill="white" />
                <text
                  x="120"
                  y="120"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="24"
                >
                  ⚡
                </text>
              </svg>
            </motion.div>

            {/* 提示文案 */}
            <div className="absolute -bottom-16 w-full text-center text-white">
              <p className="text-lg font-medium">此刻的能量状态</p>
              <p className="text-sm text-white/60">点击扇区选择</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 贴纸选择器 - 强制流程 */}
      {showStickerPicker && selectedType && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowStickerPicker(false)} />
          <motion.div
            className="bg-white w-full rounded-t-2xl p-6 relative z-10 max-h-[70vh] overflow-y-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
          >
            <h3 className="text-lg font-bold mb-4 text-center">
              选择 {selectedType.name} 表情
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {stickers
                .filter((s) => s.energy_type_id === selectedType.id)
                .map((sticker) => (
                  <button
                    key={sticker.id}
                    onClick={() => handleStickerSelect(sticker)}
                    className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-4xl mb-2">{sticker.sticker_url}</span>
                    <span className="text-xs text-gray-500">{sticker.sticker_name}</span>
                  </button>
                ))}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default EnergyCompass;
