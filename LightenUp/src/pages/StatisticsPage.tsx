import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// 定义数据类型
interface SurveyData {
  id: string;
  familyId: string;
  countyBn: string;
  person: string;
  tel: string;
  surveyDate: string;
  score: number;
  telCheck: null | string;
  voiceCheck: null | string;
  voiceUpload: string;
  crtTime: string;
  province: string;
  city: string;
  county: string;
  nature: string;
  paperBn: string;
  familyBn: string;
  houseOwner: string;
  address: string;
  familyMember: string;
  userId: string;
  userName: string;
  finishStatus: string;
  finishStatusName: string;
}

// 列名中文映射
const COLUMN_NAMES: Record<keyof SurveyData, string> = {
  id: '记录ID',
  familyId: '家庭唯一ID',
  countyBn: '县区编号',
  person: '受访者姓名',
  tel: '联系电话',
  surveyDate: '调查日期',
  score: '问卷得分',
  telCheck: '电话复核',
  voiceCheck: '语音复核',
  voiceUpload: '语音上传',
  crtTime: '创建时间',
  province: '省份',
  city: '城市',
  county: '区县',
  nature: '点位性质',
  paperBn: '问卷编号',
  familyBn: '家庭编号',
  houseOwner: '户主姓名',
  address: '详细地址',
  familyMember: '家庭成员',
  userId: '用户ID',
  userName: '用户名',
  finishStatus: '完成状态码',
  finishStatusName: '完成状态'
};

const StatisticsAnalysis: React.FC<{ data: SurveyData[] }> = ({ data }) => {
  // 处理数据导出
  const exportToExcel = () => {
    // 数据预处理
    const processedData = data.map(item => {
      const processed: Record<string, any> = {};
      Object.entries(item).forEach(([key, value]) => {
        // 处理空值
        processed[COLUMN_NAMES[key as keyof SurveyData]] = value ?? '';
      });
      return processed;
    });

    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(processedData);
    
    // 设置列宽
    const colWidths = [
      { wch: 20 }, { wch: 22 }, { wch: 12 }, 
      { wch: 15 }, { wch: 15 }, { wch: 12 },
      { wch: 10 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 18 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 15 },
      { wch: 12 }, { wch: 15 }, { wch: 25 },
      { wch: 25 }, { wch: 20 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }
    ];
    worksheet['!cols'] = colWidths;

    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '调查数据');

    // 生成文件
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array' 
    });
    
    // 创建Blob并保存
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    saveAs(blob, `调查数据_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="statistics-page">
      <h2>统计分析</h2>
      <button 
        onClick={exportToExcel}
        className="export-button"
        style={{
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        导出Excel
      </button>
    </div>
  );
};

export default StatisticsAnalysis;