import React, { useState } from 'react';
import { Select, Button, message } from 'antd';
import { utils, WorkBook, write } from 'xlsx';

interface FileConverterProps {
  content: string;
  fileType: string;
}

interface ExtractionRule {
  label: string;
  value: string;
  parse: (content: string) => any;
}

interface TagData {
  positive: string[];
  negative: string[];
  parameters: Record<string, string>;
}

const FileConverter: React.FC<FileConverterProps> = ({ content, fileType }) => {
  const [convertType, setConvertType] = useState<string>('excel');
  const [extractionRule, setExtractionRule] = useState<string>('tag');
  const [showPreview, setShowPreview] = useState<boolean>(false);

  const parseTagContent = (content: string): TagData => {
    const data: TagData = {
      positive: [],
      negative: [],
      parameters: {}
    };

    const sections = content.split('\n\n');
    sections.forEach(section => {
      if (section.startsWith('正面tag：')) {
        data.positive = section
          .replace('正面tag：', '')
          .trim()
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag);
      } else if (section.startsWith('反面tag：')) {
        data.negative = section
          .replace('反面tag：', '')
          .trim()
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag);
      } else if (section.startsWith('参数：')) {
        const paramLines = section
          .replace('参数：', '')
          .trim()
          .split('\n');
        
        paramLines.forEach(line => {
          const [key, value] = line.split(':').map(item => item.trim());
          if (key && value) {
            data.parameters[key] = value;
          }
        });
      }
    });

    return data;
  };

  const extractionRules: ExtractionRule[] = [
    {
      label: 'Tag解析',
      value: 'tag',
      parse: parseTagContent
    },
    {
      label: '简单文本',
      value: 'text',
      parse: (content: string) => ({ text: content.split('\n').filter(line => line.trim()) })
    }
  ];

  const convertToExcel = () => {
    try {
      const tagData = parseTagContent(content);
      
      // 创建工作表数据
      const wsData = [
        ['正面tag', '反面tag', '参数'],
        [
          tagData.positive.join(', '),
          tagData.negative.join(', '),
          Object.entries(tagData.parameters)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n')
        ]
      ];

      // 创建工作簿和工作表
      const wb: WorkBook = utils.book_new();
      const ws = utils.aoa_to_sheet(wsData);
      utils.book_append_sheet(wb, ws, 'Tags');

      // 设置列宽
      ws['!cols'] = [{ wch: 50 }, { wch: 50 }, { wch: 50 }];

      // 导出文件
      const buffer = write(wb, { bookType: 'xlsx', type: 'buffer' });
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tags_data.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('转换成功！');
    } catch (error) {
      message.error('转换失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  return (
    <div className="file-converter">
      <div className="converter-controls" style={{ marginBottom: '16px' }}>
        <Select
          value={extractionRule}
          onChange={setExtractionRule}
          style={{ width: 200, marginRight: 16 }}
          options={extractionRules.map(rule => ({ label: rule.label, value: rule.value }))}
        />
        <Select
          value={convertType}
          onChange={setConvertType}
          style={{ width: 200, marginRight: 16 }}
          options={[
            { label: '导出为Excel', value: 'excel' },
          ]}
        />
        <Button type="primary" onClick={convertToExcel} style={{ marginRight: 16 }}>
          开始转换
        </Button>
        <Button onClick={() => setShowPreview(!showPreview)}>
          {showPreview ? '隐藏预览' : '显示预览'}
        </Button>
      </div>
      {showPreview && (
        <div className="preview-content" style={{ 
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          padding: '16px',
          marginBottom: '16px',
          backgroundColor: '#fafafa'
        }}>
          <h4>解析预览</h4>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(extractionRules.find(rule => rule.value === extractionRule)?.parse(content), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FileConverter;