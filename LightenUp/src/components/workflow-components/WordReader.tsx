import React, { useState } from 'react';
import { read, utils } from 'xlsx';
import mammoth from 'mammoth';
import FileConverter from './FileConverter';

interface WordReaderProps {
  onFileRead?: (content: string) => void;
}

const WordReader: React.FC<WordReaderProps> = ({ onFileRead }) => {
  const [fileName, setFileName] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [fileType, setFileType] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');
    setContent('');

    const fileType = file.name.split('.').pop()?.toLowerCase();
    setFileType(fileType || '');
    const reader = new FileReader();

    reader.onerror = () => {
      setError('文件读取失败，请重试');
    };

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        
        if (fileType === 'xlsx' || fileType === 'xls') {
          const workbook = read(data, { type: 'array' });
          if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('无法解析Excel文件');
          }
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const textContent = utils.sheet_to_txt(worksheet);
          setContent(textContent);
          if (onFileRead) {
            onFileRead(textContent);
          }
        } else if (fileType === 'doc' || fileType === 'docx') {
          const result = await mammoth.extractRawText({ arrayBuffer: e.target?.result as ArrayBuffer });
          if (result.value) {
            setContent(result.value);
            if (onFileRead) {
              onFileRead(result.value);
            }
          } else {
            throw new Error('无法解析Word文件');
          }
          if (result.messages.length > 0) {
            console.warn('Word文件解析警告:', result.messages);
          }
        } else {
          throw new Error('不支持的文件格式');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '文件处理失败');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="word-reader">
      <div className="upload-section">
        <input
          type="file"
          accept=".doc,.docx,.xlsx,.xls"
          onChange={handleFileUpload}
          className="file-input"
        />
        {fileName && <p className="file-name">已上传文件: {fileName}</p>}
      </div>
      {error && (
        <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
          {error}
        </div>
      )}
      <div className="controls" style={{ marginTop: '10px' }}>
        <button
          onClick={() => setShowPreview(!showPreview)}
          style={{
            marginRight: '10px',
            padding: '5px 10px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showPreview ? '隐藏预览' : '显示预览'}
        </button>
      </div>
      {showPreview && content && (
        <div className="content-preview">
          <h3>文件内容预览：</h3>
          <div className="content-area" style={{
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            padding: '10px',
            marginTop: '10px'
          }}>
            {content.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>
      )}
      {content && (
        <div className="converter-section" style={{ marginTop: '20px' }}>
          <FileConverter content={content} fileType={fileType} />
        </div>
      )}
    </div>
  );
};

export default WordReader;