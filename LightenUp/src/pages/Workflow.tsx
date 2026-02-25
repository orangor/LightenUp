import React from 'react';
import WordReader from '../components/workflow-components/WordReader';
import ExchangeRateCompleter from '../components/Exchange/ExchangeRateCompleter';

import './Workflow.css';

const Workflow: React.FC = () => {
  const handleFileRead = (content: string) => {
    console.log('文件内容:', content);
  };

  return (
    <div className="page-container workflow-page">
      <h1>工作流</h1>
      <div className="workflow-content">
        <section className="workflow-section">
          <h2>文档处理</h2>
          <WordReader onFileRead={handleFileRead} />
        </section>
        <section className="workflow-section">
          <h2>文档处理</h2>
          <ExchangeRateCompleter />
        </section>

       
      </div>
    </div>
  );
};

export default Workflow;