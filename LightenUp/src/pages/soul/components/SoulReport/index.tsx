import React, { useMemo, useState } from 'react';
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { DatePicker, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';
import { useNavigate } from 'react-router-dom';
import './index.scss';

dayjs.locale('zh-cn');

// Types for our mocked report data
interface ReportData {
  bazi: {
    baziStr: string;
    dayMaster: string;
    blockPattern: string;
    lifeTask: string;
  };
  astrology: {
    sunMoonRising: string;
    behaviorLoop: string;
    northNode: string;
  };
  maya: {
    kinInfo: string;
    missionKeywords: string[];
    manifestationType: string;
  };
  humanDesign: {
    designType: string;
    decisionMethod: string;
    manifestationBlock: string;
  };
  chakra: {
    focusChakras: string;
    coreLeak: string;
    affirmations: string[];
  };
  summary: {
    keywords: string[];
    actionStep: string;
    actionReason: string;
  };
}

const SoulReport: React.FC = () => {
  const navigate = useNavigate();
  const [birthDatetime, setBirthDatetime] = useState<Dayjs | null>(null);
  const [birthCity, setBirthCity] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const selectedDatetimeText = useMemo(
    () => (birthDatetime ? birthDatetime.format('YYYY年MM月DD日 HH:mm') : '请选择你的出生时刻'),
    [birthDatetime]
  );

  const handleGenerate = () => {
    if (!birthDatetime || !birthCity) return;
    
    setIsGenerating(true);
    
    // Simulate AI API call
    setTimeout(() => {
      // Mocked data matching the prompt structure
      const mockReport: ReportData = {
        bazi: {
          baziStr: '癸亥年 乙卯月 丙子日 庚寅时',
          dayMaster: '丙火偏弱，重情重义，内敛含蓄',
          blockPattern: '情感模式：容易付出过多，难以坦然接受他人的帮助与馈赠。',
          lifeTask: '在关系中学会接纳自己，允许爱自然流动。'
        },
        astrology: {
          sunMoonRising: '🌞 太阳双鱼 | 🌙 月亮处女 | ⬆️ 上升天蝎',
          behaviorLoop: '「总是先照顾别人、忽视自己的需求」—— 月亮处女座让你习惯通过服务他人来获取安全感。',
          northNode: '北交点金牛座：这一生需要从过度依赖情感共生，走向建立自我价值与物质独立。'
        },
        maya: {
          kinInfo: 'Kin 113 · 红色太阳的运行者 · 9调',
          missionKeywords: ['流动', '疗愈', '宇宙之水'],
          manifestationType: '接收型：在深度静心与情绪顺流中自然吸引，而非用力抓取。'
        },
        humanDesign: {
          designType: '⚡ 投射者 · 等待邀请 · 直觉权威 · 2/4 轮廓',
          decisionMethod: '你的最佳决策方式是倾听身体当下的直觉（哪怕没有逻辑），而不是用头脑反复权衡。',
          manifestationBlock: '你过去的显化可能逆着设计走：过度主动发起，反而遭遇阻力与苦涩。'
        },
        chakra: {
          focusChakras: '太阳神经丛 & 心轮',
          coreLeak: '在好事即将发生时，内心深处觉得「我不配得到这么好的东西」，从而无意识地推开机会。',
          affirmations: [
            '我值得拥有一切美好与丰盛',
            '我敞开心扉，安全地接受宇宙的馈赠',
            '我的存在本身就是最大的价值'
          ]
        },
        summary: {
          keywords: ['顺流而下', '价值重塑', '直觉引领', '静心显化'],
          actionStep: '每日进行 10 分钟的「心轮接收冥想」',
          actionReason: '帮助你清理「不配得感」，将你的能量场从「过度付出」切换到「允许接收」的状态。'
        }
      };
      
      setReportData(mockReport);
      setIsGenerating(false);
    }, 3500); // 3.5s delay for effect
  };

  return (
    <div className="soul-report-container">
      <div className="back-nav" onClick={() => navigate('/soul')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        返回探索
      </div>

      {!reportData && !isGenerating && (
        <>
          <h1 className="luxury-heading">灵魂初始属性</h1>
          <p className="luxury-subheading">Soul Initial Attributes Analyst</p>
          
          <div className="soul-form">
            <div className="input-group">
              <label>出生时间 (精确到分)</label>
              <div className="picker-shell">
                <div className="picker-highlight">
                  <CalendarOutlined />
                  <span>{selectedDatetimeText}</span>
                </div>
                <ConfigProvider locale={zhCN}>
                  <DatePicker
                    className="soul-date-picker"
                    popupClassName="soul-date-popup"
                    placeholder="选择出生日期和时间"
                    value={birthDatetime}
                    format="YYYY-MM-DD HH:mm"
                    showTime={{
                      format: 'HH:mm',
                      minuteStep: 1,
                      defaultOpenValue: dayjs().hour(12).minute(0).second(0)
                    }}
                    inputReadOnly
                    allowClear
                    needConfirm={false}
                    showNow={false}
                    suffixIcon={<ClockCircleOutlined />}
                    disabledDate={(current) => !!current && current.endOf('day').isAfter(dayjs())}
                    onChange={(value) => setBirthDatetime(value)}
                  />
                </ConfigProvider>
              </div>
            </div>
            
            <div className="input-group">
              <label>出生城市 (精确到区)</label>
              <div className="text-input-shell">
                <EnvironmentOutlined />
                <input
                  type="text"
                  placeholder="如：北京市朝阳区"
                  value={birthCity}
                  onChange={(e) => setBirthCity(e.target.value)}
                />
              </div>
            </div>

            <button 
              className="submit-btn" 
              onClick={handleGenerate}
              disabled={!birthDatetime || !birthCity}
            >
              生成底层剧本解析
            </button>
          </div>
        </>
      )}

      {isGenerating && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>正在链接宇宙频率，读取你的底层剧本...</p>
        </div>
      )}

      {reportData && !isGenerating && (
        <div className="report-container">
          <div className="report-header">
            <h1 className="luxury-heading">你的游戏初始属性报告</h1>
            <p>洞悉先天设定 · 解锁显化节奏</p>
          </div>

          <div className="report-chapter">
            <div className="chapter-title">第一章 · 底层剧本</div>
            <div className="chapter-content">
              <div className="highlight-row">
                <span className="label">你的八字</span>
                <span className="value">{reportData.bazi.baziStr}</span>
              </div>
              <div className="highlight-row">
                <span className="label">日主特质</span>
                <span className="value">{reportData.bazi.dayMaster}</span>
              </div>
              <div className="highlight-row">
                <span className="label">核心卡点</span>
                <span className="value">{reportData.bazi.blockPattern}</span>
              </div>
              <div className="highlight-row">
                <span className="label">主线任务</span>
                <span className="value">{reportData.bazi.lifeTask}</span>
              </div>
            </div>
          </div>

          <div className="report-chapter">
            <div className="chapter-title">第二章 · 性格密码</div>
            <div className="chapter-content">
              <div className="highlight-row">
                <span className="label">核心星象</span>
                <span className="value">{reportData.astrology.sunMoonRising}</span>
              </div>
              <div className="highlight-row">
                <span className="label">行为回路</span>
                <span className="value">{reportData.astrology.behaviorLoop}</span>
              </div>
              <div className="highlight-row">
                <span className="label">灵魂方向</span>
                <span className="value">{reportData.astrology.northNode}</span>
              </div>
            </div>
          </div>

          <div className="report-chapter">
            <div className="chapter-title">第三章 · 宇宙频率</div>
            <div className="chapter-content">
              <div className="highlight-row">
                <span className="label">玛雅印记</span>
                <span className="value">{reportData.maya.kinInfo}</span>
              </div>
              <div className="highlight-row">
                <span className="label">使命天赋</span>
                <span className="value">{reportData.maya.missionKeywords.join(' · ')}</span>
              </div>
              <div className="highlight-row">
                <span className="label">显化方式</span>
                <span className="value">{reportData.maya.manifestationType}</span>
              </div>
            </div>
          </div>

          <div className="report-chapter">
            <div className="chapter-title">第四章 · 先天设计</div>
            <div className="chapter-content">
              <div className="highlight-row">
                <span className="label">能量类型</span>
                <span className="value">{reportData.humanDesign.designType}</span>
              </div>
              <div className="highlight-row">
                <span className="label">决策策略</span>
                <span className="value">{reportData.humanDesign.decisionMethod}</span>
              </div>
              <div className="highlight-row">
                <span className="label">显化误区</span>
                <span className="value">{reportData.humanDesign.manifestationBlock}</span>
              </div>
            </div>
          </div>

          <div className="report-chapter">
            <div className="chapter-title">第五章 · 能量地图</div>
            <div className="chapter-content">
              <div className="highlight-row">
                <span className="label">重点关注脉轮</span>
                <span className="value">{reportData.chakra.focusChakras}</span>
              </div>
              <div className="highlight-row">
                <span className="label">能量漏水洞</span>
                <span className="value">{reportData.chakra.coreLeak}</span>
              </div>
              <div className="affirmations">
                {reportData.chakra.affirmations.map((text, i) => (
                  <p key={i}>"{text}"</p>
                ))}
              </div>
            </div>
          </div>

          <div className="report-footer">
            <div className="keywords">
              {reportData.summary.keywords.map((kw, i) => (
                <span key={i}>{kw}</span>
              ))}
            </div>
            
            <div className="action-step">
              <h4>📌 第一步行动建议</h4>
              <p><strong>{reportData.summary.actionStep}</strong></p>
              <p style={{marginTop: '8px'}}>{reportData.summary.actionReason}</p>
            </div>

            <div className="brand-signature">
              — lighten up & 执行清单 · 点亮你的剧本 —
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoulReport;
