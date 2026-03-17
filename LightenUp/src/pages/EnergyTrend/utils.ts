// 获取能量颜色
export const getEnergyColor = (value: number) => {
  // 喜悦/合一 - Warm Sunlight Gold
  if (value >= 450) return '#FFD166'
  // 平静/勇气 - Mint Green
  if (value >= 250) return '#38D9A9'
  // 愤怒/抱怨 - Soft Coral Red
  if (value > 150) return '#FF6B6B'
  // 焦虑/恐惧 - Deep Serenity Purple
  return '#7B61FF'
}
