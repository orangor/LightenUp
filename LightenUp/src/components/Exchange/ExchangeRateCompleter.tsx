import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface ExchangeRateData {
  currency: string;
  dates: string[];
  rates: number[];
}

interface ProcessedData {
  date: string;
  rate: number;
  currency: string;
  sheetName: string;
}

const ExchangeRateCompleter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [completedData, setCompletedData] = useState<ExchangeRateData[]>([]);
  const [previewData, setPreviewData] = useState<ProcessedData[]>([]);
  const [error, setError] = useState<string>('');

  // 从Excel文件中读取数据
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // 处理所有sheet的数据
          const processedData: ProcessedData[] = [];
          workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: "A" });
            
            // 跳过标题行，处理数据格式
            const sheetData = jsonData.slice(1).map((row: any) => {
              const date = row.A;  // 第一列是时间
              const rate = parseFloat(row.B);  // 第二列是汇率
              if (!date || isNaN(rate)) {
                console.warn('Invalid row:', row);
                return null;
              }
              // 标准化日期格式：移除前导零
              const standardDate = date.replace(/\.0+/g, '.').replace(/\.(\d)(?=\.)/g, '.$1');
              return {
                date: standardDate,
                rate,
                currency: sheetName.includes('美元') ? 'USD' : 'EUR',
                sheetName
              };
            }).filter(Boolean) as ProcessedData[]; // 过滤无效数据
            
            console.log(`Sheet ${sheetName} processed: ${sheetData.length} valid rows`);
            processedData.push(...sheetData);
          });
          
          if (processedData.length === 0) {
            throw new Error('没有找到有效的汇率数据，请检查Excel文件格式是否正确');
          }
          
          console.log('Total processed data:', processedData.length);
          setPreviewData(processedData);
        } catch (err) {
          console.error('File processing error:', err);
          setError(err instanceof Error ? err.message : '文件处理失败');
        }
      };
      reader.onerror = () => {
        setError('文件读取失败');
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  // 补全缺失的周末数据
  const completeData = (data: ProcessedData[]) => {
    try {
      console.log('Starting data completion...');
      const result: ExchangeRateData[] = [];
      const currencies = Array.from(new Set(data.map(item => item.currency)));
      console.log('Found currencies:', currencies);
      
      currencies.forEach(currency => {
        const currencyData = data.filter(item => item.currency === currency);
        console.log(`Processing ${currency}: ${currencyData.length} records`);
        
        const dates = currencyData.map(item => item.date);
        const rates = currencyData.map(item => item.rate);
        
        if (dates.length === 0 || rates.length === 0) {
          throw new Error(`${currency} 没有有效的数据记录`);
        }
        
        // 找到数据中的日期范围
        const startDate = new Date(Math.min(...dates.map(d => new Date(d).getTime())));
        const endDate = new Date(Math.max(...dates.map(d => new Date(d).getTime())));
        console.log(`Date range for ${currency}: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        
        // 生成完整的日期范围
        const allDates: string[] = [];
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1);  // 移除前导零
          const day = String(currentDate.getDate());  // 移除前导零
          const dateString = `${year}.${month}.${day}`;
          allDates.push(dateString);
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        console.log(`Generated ${allDates.length} dates for ${currency}`);
        
        // 补全缺失的日期
        const completedRates: number[] = [];
        
        allDates.forEach((date, index) => {
          const existingData = currencyData.find(item => item.date === date);
          if (existingData) {
            // 保持现有数据不变
            completedRates.push(existingData.rate);
          } else {
            // 检查是否是周末
            const currentDate = new Date(date.replace(/\./g, '-'));
            const dayOfWeek = currentDate.getDay(); // 0是周日，6是周六
            
            if (dayOfWeek === 0 || dayOfWeek === 6) {
              // 对于周末的缺失数据，使用插值法
              // 找到前一个有效值（周六用周五的数据，周日用周六的数据）
              let prevIndex = index - 1;
              let prevRate: number | null = null;
              while (prevIndex >= 0) {
                const prevDate = allDates[prevIndex];
                if (dayOfWeek === 6) {
                  // 周六：使用周五的数据
                  const prevData = currencyData.find(item => item.date === prevDate);
                  if (prevData) {
                    prevRate = prevData.rate;
                    break;
                  }
                } else {
                  // 周日：优先使用周六的补全数据
                  const prevDateObj = new Date(prevDate.replace(/\./g, '-'));
                  if (prevDateObj.getDay() === 6) {
                    prevRate = completedRates[prevIndex];
                    break;
                  }
                }
                prevIndex--;
              }

              // 找到后一个工作日的数据（下周一）
              let nextIndex = index + 1;
              let nextRate: number | null = null;
              while (nextIndex < allDates.length) {
                const nextDate = allDates[nextIndex];
                const nextData = currencyData.find(item => item.date === nextDate);
                if (nextData) {
                  nextRate = nextData.rate;
                  break;
                }
                nextIndex++;
              }

              if (prevRate !== null && nextRate !== null) {
                // 使用插值法计算周末汇率
                const interpolatedRate = Number(((prevRate + nextRate) / 2).toFixed(5));
                completedRates.push(interpolatedRate);
              } else if (prevRate !== null) {
                // 如果只有前值，使用前值
                completedRates.push(prevRate);
              } else if (nextRate !== null) {
                // 如果只有后值，使用后值
                completedRates.push(nextRate);
              } else {
                // 异常情况，使用最后一个已知值
                const lastKnownRate = completedRates[completedRates.length - 1];
                completedRates.push(lastKnownRate || 0);
              }
            } else {
              // 如果是工作日缺失数据（异常情况），保持空值
              console.warn(`Missing data for weekday: ${date}`);
              const lastKnownRate = completedRates[completedRates.length - 1];
              completedRates.push(lastKnownRate || 0);
            }
          }
        });
        
        console.log(`Completed ${completedRates.length} rates for ${currency}`);
        result.push({
          currency,
          dates: allDates,
          rates: completedRates
        });
      });
      
      console.log('Data completion finished:', result);
      return result;
    } catch (err) {
      console.error('Data completion error:', err);
      throw err;
    }
  };

  // 导出补全后的Excel文件
  const exportCompletedData = () => {
    if (completedData.length === 0) {
      setError('没有可导出的数据');
      return;
    }
    
    try {
      const workbook = XLSX.utils.book_new();
      
      completedData.forEach((currencyData) => {
        const worksheetData = [
          ['日期', '汇率']
        ];
        
        currencyData.dates.forEach((date, i) => {
          // 保持原始日期格式
          worksheetData.push([date, currencyData.rates[i].toFixed(4)]);
        });
        
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // 设置列宽
        const wscols = [
          { wch: 12 }, // 日期列宽
          { wch: 10 }  // 汇率列宽
        ];
        worksheet['!cols'] = wscols;
        
        // 使用货币类型作为sheet名
        const sheetName = currencyData.currency === 'USD' ? '美元兑人民币' : '欧元兑人民币';
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });
      
      XLSX.writeFile(workbook, '补全后的汇率数据.xlsx');
      console.log('Excel file exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      setError('导出文件失败');
    }
  };

  // 处理数据补全
  const handleCompleteData = () => {
    if (previewData.length === 0) {
      setError('没有数据可以处理');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      console.log('Starting data completion process...');
      const completed = completeData(previewData);
      setCompletedData(completed);
      console.log('Data completion successful');
    } catch (err) {
      console.error('Complete data error:', err);
      setError(err instanceof Error ? err.message : '数据处理失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="exchange-rate-completer">
      <h2>汇率数据补全工具</h2>
      
      <div className="upload-section">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
        />
        {file && (
          <div>
            <p>已选择文件: {file.name}</p>
            <button 
              onClick={handleCompleteData} 
              disabled={loading || previewData.length === 0}
            >
              {loading ? '正在处理...' : '补全数据'}
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="error-message" style={{ color: 'red', margin: '10px 0' }}>
          {error}
        </div>
      )}
      
      {completedData.length > 0 && (
        <div className="export-section">
          <button onClick={exportCompletedData}>
            导出补全后的Excel
          </button>
        </div>
      )}
      
      {previewData.length > 0 && (
        <div className="preview-section">
          <h3>数据预览 (共 {previewData.length} 条记录)</h3>
          <table>
            <thead>
              <tr>
                <th>日期</th>
                <th>汇率</th>
                <th>货币</th>
                <th>数据表</th>
              </tr>
            </thead>
            <tbody>
              {previewData.slice(0, 10).map((row, index) => (
                <tr key={index}>
                  <td>{row.date}</td>
                  <td>{row.rate.toFixed(4)}</td>
                  <td>{row.currency}</td>
                  <td>{row.sheetName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExchangeRateCompleter;