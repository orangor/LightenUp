import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import './index.scss';

// --- Constants & Types ---
const MOODS: Record<string, { label: string; emoji: string; color: string; energy: number; description: string }> = {
  apathy: { label: '万念俱灰', emoji: '😶', color: '#a0a0a0', energy: 1, description: 'Apathy' },
  grief: { label: '悲苦', emoji: '😢', color: '#7ea3c1', energy: 2, description: 'Grief' },
  fear: { label: '恐惧', emoji: '😨', color: '#b47ec6', energy: 3, description: 'Fear' },
  lust: { label: '贪求', emoji: '😤', color: '#e8925a', energy: 4, description: 'Lust' },
  anger: { label: '愤怒', emoji: '😠', color: '#e07b6b', energy: 5, description: 'Anger' },
  pride: { label: '自尊自傲', emoji: '😏', color: '#c9a832', energy: 6, description: 'Pride' },
  courage: { label: '无畏', emoji: '✨', color: '#7bc67e', energy: 7, description: 'Courageousness' },
  acceptance: { label: '接纳', emoji: '🌿', color: '#5bb8a8', energy: 8, description: 'Acceptance' },
  peace: { label: '平静', emoji: '🌊', color: '#7ab8d4', energy: 9, description: 'Peace' },
};

const MOOD_KEYS = Object.keys(MOODS);
const TAGS = ['工作', '人际', '论文', '求职', '身体', '睡眠', '天气', '饮食', '运动', '学习', '创作', '内省'];
const STORAGE_KEY = 'sedona_mood_entries';

interface Release {
  id: string;
  completedAt: string;
  emotionLabel: string;
  bodyLocation: string;
  bodySensation: string;
  rootCause: string;
  rootLabel: string;
}

interface Entry {
  id: string;
  timestamp: string;
  mood: string;
  intensity: number;
  tags: string[];
  note: string;
  releases: Release[];
}

const SEDONA_ROOTS = [
  { id: 'approval', title: '🌸 想要被认可', desc: '需要他人肯定、认同、看见自己的价值' },
  { id: 'control', title: '⚡ 想要控制', desc: '需要掌控结果、进度、他人，或对失控感到恐惧' },
  { id: 'security', title: '🌿 想要安全感', desc: '需要确定性、稳定感，害怕未知或失去' },
];

const Sedona: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'log' | 'history'>('log');
  const [entries, setEntries] = useState<Entry[]>([]);
  
  // Log Form State
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState<string>('');
  const [postLogEntry, setPostLogEntry] = useState<Entry | null>(null);

  // Sedona Release State
  const [isSedonaOpen, setIsSedonaOpen] = useState(false);
  const [sedonaState, setSedonaState] = useState({
    entryId: '',
    step: 0,
    rawInput: '',
    emotionLabel: '',
    emotionColor: '',
    emotionNote: '',
    bodyLocation: '',
    bodySensation: '',
    canAllow: null as boolean | null,
    rootCause: '',
    appendNote: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved entries', e);
      }
    }
  }, []);

  const saveEntries = (newEntries: Entry[]) => {
    setEntries(newEntries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
  };

  const handleLogSubmit = () => {
    if (!selectedMood) return;
    const newEntry: Entry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      mood: selectedMood,
      intensity,
      tags: selectedTags,
      note,
      releases: [],
    };
    saveEntries([newEntry, ...entries]);
    
    // Reset form
    setSelectedMood(null);
    setIntensity(5);
    setSelectedTags([]);
    setNote('');
    
    // Show post log prompt
    setPostLogEntry(newEntry);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确认删除这条记录吗？')) {
      saveEntries(entries.filter(e => e.id !== id));
    }
  };

  const startRelease = (entry: Entry) => {
    setPostLogEntry(null);
    const m = MOODS[entry.mood];
    setSedonaState({
      entryId: entry.id,
      step: 0,
      rawInput: entry.note || '',
      emotionLabel: m.label,
      emotionColor: m.color,
      emotionNote: '',
      bodyLocation: '',
      bodySensation: '',
      canAllow: null,
      rootCause: '',
      appendNote: '',
    });
    setIsSedonaOpen(true);
  };

  // ---- Sedona Process Functions ----
  const updateSedona = (updates: Partial<typeof sedonaState>) => {
    setSedonaState(prev => ({ ...prev, ...updates, appendNote: '' }));
  };

  const submitFeeling = async () => {
    updateSedona({ step: 1 }); // loading
    // Mocking AI for now to avoid external dependencies, can be replaced later
    setTimeout(() => {
      updateSedona({ 
        step: 2,
        emotionNote: '我听到你了。'
      });
    }, 1000);
  };

  const saveRelease = () => {
    const entryIndex = entries.findIndex(e => e.id === sedonaState.entryId);
    if (entryIndex === -1) return;
    
    const newEntries = [...entries];
    const rootLabel = SEDONA_ROOTS.find(r => r.id === sedonaState.rootCause)?.title || '';
    
    newEntries[entryIndex].releases.push({
      id: Date.now().toString(),
      completedAt: new Date().toISOString(),
      emotionLabel: sedonaState.emotionLabel,
      bodyLocation: sedonaState.bodyLocation,
      bodySensation: sedonaState.bodySensation,
      rootCause: sedonaState.rootCause,
      rootLabel,
    });
    
    saveEntries(newEntries);
    updateSedona({ step: 9 });
  };

  // ---- Render Helpers ----
  const renderLogTab = () => {
    if (postLogEntry) {
      const m = MOODS[postLogEntry.mood];
      return (
        <div className="post-log-prompt">
          <div className="post-log-card">
            <div className="post-log-check">✓</div>
            <div className="post-log-title">情绪已记录</div>
            <div className="post-log-meta">
              <div className="post-log-meta-mood">
                <div className="post-log-meta-dot" style={{ background: m.color }}></div>
                {m.emoji} {m.label}
              </div>
              <span className="post-log-meta-badge">强度 {postLogEntry.intensity}</span>
              {postLogEntry.tags.map(t => (
                <span key={t} className="post-log-meta-badge">{t}</span>
              ))}
            </div>
            {postLogEntry.note && (
              <div className="post-log-note-preview">"{postLogEntry.note}"</div>
            )}
            <div className="post-log-cta">
              想对这份<em>情绪</em>做一次圣多纳释放吗？
            </div>
            <div className="post-log-btn-row">
              <button className="btn-primary" onClick={() => startRelease(postLogEntry)}>🌿 开始释放</button>
              <button className="btn-secondary" onClick={() => setPostLogEntry(null)}>稍后</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="log-form animation-fade-up">
        <div className="sedona-banner">
          <strong>圣多纳情绪层级</strong> — 从 万念俱灰 到 平静，自下而上代表能量提升。<br />
          选择此刻你真实感受到的情绪，记录后可直接做圣多纳释放。
        </div>

        <div className="section-label">此刻，你感觉如何？</div>
        <div className="sedona-header">
          <span className="sedona-scale">低能量</span>
          <div className="scale-arrow"></div>
          <span className="sedona-scale">高能量</span>
        </div>

        <div className="mood-grid">
          {MOOD_KEYS.map(key => {
            const m = MOODS[key];
            const isSelected = selectedMood === key;
            return (
              <div 
                key={key} 
                className={`mood-card ${isSelected ? 'selected' : ''}`}
                style={{ '--mc': m.color } as React.CSSProperties}
                onClick={() => setSelectedMood(key)}
              >
                <span className="mood-level">{m.energy}</span>
                <span className="mood-emoji">{m.emoji}</span>
                <span className="mood-label">{m.label}</span>
                <span className="mood-sub">{m.description}</span>
              </div>
            );
          })}
        </div>

        <div className="section-label">强度</div>
        <div className="intensity-row">
          <input 
            type="range" 
            min="1" max="10" 
            value={intensity} 
            onChange={(e) => setIntensity(Number(e.target.value))}
            style={{ '--val': `${((intensity - 1) / 9) * 100}%` } as React.CSSProperties}
          />
          <div className="intensity-val">{intensity}</div>
        </div>

        <div className="section-label">触发因素 <span className="hint">(可多选)</span></div>
        <div className="tag-grid">
          {TAGS.map(tag => (
            <button 
              key={tag}
              className={`tag-btn ${selectedTags.includes(tag) ? 'selected' : ''}`}
              onClick={() => setSelectedTags(prev => 
                prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="section-label">备注</div>
        <textarea 
          placeholder="此刻在想什么？哪怕几个字也好…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <button 
          className="submit-btn" 
          onClick={handleLogSubmit}
          disabled={!selectedMood}
        >
          记录此刻
        </button>
      </div>
    );
  };

  const renderHistoryTab = () => {
    if (entries.length === 0) {
      return (
        <div className="history-empty">
          <span className="empty-icon">🌱</span>
          还没有任何记录<br />去「记录」标签写下今天的情绪吧
        </div>
      );
    }

    // Group by date
    const groups: Record<string, Entry[]> = {};
    entries.forEach(e => {
      const date = moment(e.timestamp).format('YYYY-MM-DD');
      if (!groups[date]) groups[date] = [];
      groups[date].push(e);
    });

    return (
      <div className="history-list animation-fade-up">
        <div className="history-controls">
          <div className="history-count">共 {entries.length} 条记录</div>
        </div>
        
        {Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(date => {
          const isToday = date === moment().format('YYYY-MM-DD');
          const isYesterday = date === moment().subtract(1, 'days').format('YYYY-MM-DD');
          const dateLabel = isToday ? `今天 · ${moment(date).format('M月D日')}` : 
                            isYesterday ? `昨天 · ${moment(date).format('M月D日')}` : 
                            moment(date).format('YYYY年M月D日 dddd');

          return (
            <div key={date} className="day-group">
              <div className="day-label">{dateLabel}</div>
              {groups[date].map(e => {
                const m = MOODS[e.mood];
                return (
                  <div key={e.id} className="history-card">
                    <button className="delete-btn" onClick={() => handleDelete(e.id)}>✕</button>
                    <div className="history-card-top">
                      <div className="history-mood-dot" style={{ background: m.color }}></div>
                      <div className="history-mood-name">{m.emoji} {m.label}</div>
                      <div className="history-time">{moment(e.timestamp).format('HH:mm')}</div>
                      <div className="history-intensity">强度 {e.intensity}</div>
                    </div>
                    {e.tags.length > 0 && (
                      <div className="history-tags">
                        {e.tags.map(t => <span key={t} className="history-tag">{t}</span>)}
                      </div>
                    )}
                    {e.note && <div className="history-note">{e.note}</div>}
                    <div className="history-card-footer">
                      <div className="release-badge-row">
                        {e.releases.length > 0 && (
                          <span className="release-badge">🌿 已释放 ×{e.releases.length}</span>
                        )}
                      </div>
                      <button className="release-entry-btn" onClick={() => startRelease(e)}>
                        {e.releases.length > 0 ? '再次释放' : '🌿 开始释放'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSedonaStep = () => {
    const { step, emotionColor, emotionLabel, emotionNote, bodyLocation, bodySensation, rootCause, appendNote } = sedonaState;
    const sDots = (
      <div className="s-dots">
        {[0,1,2,3,4,5,6,7,8,9].map(i => (
          <div key={i} className={`s-dot ${i < step ? 'done' : i === step ? 'active' : ''}`}></div>
        ))}
      </div>
    );

    const wrapCard = (content: React.ReactNode) => (
      <div className="s-card animation-fade-up">
        {sDots}
        {content}
        {appendNote && <div className="s-note-append" dangerouslySetInnerHTML={{ __html: appendNote }} />}
      </div>
    );

    switch (step) {
      case 0:
        return wrapCard(
          <>
            <div className="s-label">开始</div>
            <div className="s-question">现在，你感受到了什么？<br /><em>用你自己的话说就好。</em></div>
            <div className="s-hint">闭上眼睛几秒钟，感受一下身体。<br />下面已经为你预填了备注，可以直接修改或补充。</div>
            <textarea 
              className="s-input" 
              placeholder="例如：我很烦，不想看论文……" 
              rows={3}
              value={sedonaState.rawInput}
              onChange={(e) => updateSedona({ rawInput: e.target.value })}
            />
            <div className="s-btn-row">
              <button className="s-btn-primary" onClick={submitFeeling}>继续 →</button>
            </div>
          </>
        );
      case 1:
        return wrapCard(
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>正在感受你的情绪……</div>
            <div className="s-loading-dots"><span></span><span></span><span></span></div>
          </div>
        );
      case 2:
        return wrapCard(
          <>
            <div className="s-emotion-tag" style={{ background: `${emotionColor}22`, color: emotionColor, borderColor: `${emotionColor}44` }}>
              ● {emotionLabel}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>{emotionNote}</div>
            <div className="s-label">身体扫描</div>
            <div className="s-question">把注意力轻轻放到身体里。<br />这份感受，在<em>哪个地方</em>？</div>
            <div className="s-hint">胸口、喉咙、肚子、肩膀、头部……<br />不用找到"正确答案"，哪里有感觉说哪里。</div>
            <textarea 
              className="s-input" 
              placeholder="例如：喉咙" 
              rows={2}
              value={bodyLocation}
              onChange={(e) => updateSedona({ bodyLocation: e.target.value })}
            />
            <div className="s-btn-row">
              <button className="s-btn-primary" onClick={() => { if(bodyLocation) updateSedona({ step: 3 }) }}>继续 →</button>
            </div>
          </>
        );
      case 3:
        return wrapCard(
          <>
            <div className="s-label">身体扫描</div>
            <div className="s-question"><em>{bodyLocation}</em>那里，<br />那个感觉是什么状态？</div>
            <div className="s-hint">紧绷、堵住、沉重、发热、收缩……<br />就像在描述一个物体一样描述它。</div>
            <textarea 
              className="s-input" 
              placeholder="例如：紧绷、发热" 
              rows={2}
              value={bodySensation}
              onChange={(e) => updateSedona({ bodySensation: e.target.value })}
            />
            <div className="s-btn-row">
              <button className="s-btn-primary" onClick={() => { if(bodySensation) updateSedona({ step: 4 }) }}>继续 →</button>
            </div>
          </>
        );
      case 4:
        return wrapCard(
          <>
            <div className="s-label">欢迎它</div>
            <div className="s-question">把注意力放在 <em>{bodyLocation}</em> 那里。<br />那份 <em>{bodySensation}</em> 的感觉——</div>
            <div className="s-hint">不用改变它，不用推开它。<br />就像你在观察一朵云，你看着它，但你不是那朵云。</div>
            <div className="s-question" style={{ marginTop: 16, marginBottom: 12, fontSize: 16 }}>你能允许这个感觉<em>就这样存在</em>吗？<br />哪怕只是这一刻。</div>
            <div className="s-choice-row">
              <button className="s-choice yes" onClick={() => updateSedona({ step: 5 })}>可以</button>
              <button className="s-choice no" onClick={() => updateSedona({ appendNote: '没关系。试着再给它一点空间——哪怕1%的允许也好。<br>你不需要喜欢它，只是不抗拒它的存在。' })}>有点难</button>
            </div>
          </>
        );
      case 5:
        return wrapCard(
          <>
            <div className="s-label">找到根源</div>
            <div className="s-question">这份感受背后，<br />最重的是哪一种<em>想要</em>？</div>
            <div className="s-root-grid">
              {SEDONA_ROOTS.map(r => (
                <div 
                  key={r.id} 
                  className={`s-root-card ${rootCause === r.id ? 'selected' : ''}`}
                  onClick={() => updateSedona({ rootCause: r.id })}
                >
                  <div className="s-root-title">{r.title}</div>
                  <div className="s-root-desc">{r.desc}</div>
                </div>
              ))}
            </div>
            <div className="s-btn-row" style={{ marginTop: 16 }}>
              <button className="s-btn-primary" disabled={!rootCause} onClick={() => updateSedona({ step: 6 })}>确认 →</button>
            </div>
          </>
        );
      case 6:
        const rLabel = SEDONA_ROOTS.find(r => r.id === rootCause)?.title;
        return wrapCard(
          <>
            <div className="s-root-badge">🌀 根源：{rLabel}</div>
            <div className="s-label">第一个问题</div>
            <div className="s-question">你愿意放下这个<em>"{rLabel}"</em>的需要吗？</div>
            <div className="s-hint">不是说你要放弃目标，<br />只是放下那个"必须如此"的抓取感。</div>
            <div className="s-choice-row" style={{ marginTop: 20 }}>
              <button className="s-choice yes" onClick={() => updateSedona({ step: 7 })}>愿意</button>
              <button className="s-choice no" onClick={() => {
                updateSedona({ appendNote: '不愿意也没关系，这本身就是一个诚实的回答。<br>只是问问自己：如果愿意，会怎样？' });
                setTimeout(() => updateSedona({ step: 7 }), 2200);
              }}>不太愿意</button>
            </div>
          </>
        );
      case 7:
        return wrapCard(
          <>
            <div className="s-label">第二个问题</div>
            <div className="s-question">那你<em>什么时候</em>愿意<br />放下"{SEDONA_ROOTS.find(r => r.id === rootCause)?.title}"这个需要？</div>
            <div className="s-choice-row" style={{ marginTop: 20 }}>
              <button className="s-choice yes" onClick={() => updateSedona({ step: 8 })}>就是现在</button>
            </div>
          </>
        );
      case 8:
        return wrapCard(
          <>
            <div className="s-label">检查</div>
            <div className="s-question">放下它。<br /><br />再感受一下 <em>{bodyLocation}</em>，<br />那里现在怎么样了？</div>
            <div className="s-hint">完全消失了？还是还有一些剩余的感觉？<br />有剩余也完全正常，一层一层来。</div>
            <div className="s-choice-row" style={{ marginTop: 20 }}>
              <button className="s-choice yes" onClick={saveRelease}>消失了 / 好多了</button>
              <button className="s-choice no" onClick={() => {
                updateSedona({ step: 4, appendNote: '很好，继续陪着它。一层一层往下走。' });
              }}>还有一些</button>
            </div>
          </>
        );
      case 9:
        return wrapCard(
          <div className="s-completion">
            <div className="s-completion-icon">🌿</div>
            <div className="s-completion-title">这次释放完成了</div>
            <div className="s-completion-desc">
              你刚才做了一件很了不起的事——<br />
              你没有逃开那份感受，你陪着它走完了。<br /><br />
              <em>{emotionLabel}</em> 背后的 <em>{SEDONA_ROOTS.find(r => r.id === rootCause)?.title}</em>，<br />
              今天松动了一点。
            </div>
            <div className="s-btn-row">
              <button className="s-btn-primary" onClick={() => updateSedona({ step: 0, rootCause: '', bodyLocation: '', bodySensation: '' })}>再做一次</button>
              <button className="s-btn-secondary" onClick={() => setIsSedonaOpen(false)}>返回日记</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="sedona-container">
      <div className="back-nav" onClick={() => navigate('/soul')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        返回灵性探索
      </div>

      <header className="page-header">
        <h1 className="luxury-heading">情绪日记</h1>
        <p className="luxury-subheading">Mood Journal · Sedona Release</p>
      </header>

      <nav className="tabs-nav">
        <button className={`nav-btn ${activeTab === 'log' ? 'active' : ''}`} onClick={() => setActiveTab('log')}>记录</button>
        <button className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>历史</button>
      </nav>

      <main className="tab-content">
        {activeTab === 'log' && renderLogTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </main>

      {/* Bottom Sheet for Sedona */}
      <div className={`sedona-sheet ${isSedonaOpen ? 'open' : ''}`}>
        <div className="sedona-backdrop" onClick={() => setIsSedonaOpen(false)}></div>
        <div className="sedona-panel">
          <div className="sedona-handle-bar"><div className="sedona-handle"></div></div>
          <div className="sedona-sheet-header">
            <div className="sedona-sheet-title">圣多纳释放 <span className="accent">Release</span></div>
            <button className="sedona-close-btn" onClick={() => setIsSedonaOpen(false)}>✕</button>
          </div>
          {sedonaState.entryId && (
            <div className="sedona-entry-context">
              <span className="ctx-emoji">{MOODS[entries.find(e => e.id === sedonaState.entryId)?.mood || 'peace']?.emoji}</span>
              <span className="ctx-mood">{MOODS[entries.find(e => e.id === sedonaState.entryId)?.mood || 'peace']?.label}</span>
              <span className="divider">·</span>
              <span>强度 {entries.find(e => e.id === sedonaState.entryId)?.intensity}</span>
              {entries.find(e => e.id === sedonaState.entryId)?.note && (
                <div className="ctx-note">"{entries.find(e => e.id === sedonaState.entryId)?.note}"</div>
              )}
            </div>
          )}
          <div className="sedona-content">
            {renderSedonaStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sedona;
