import React, { useState, useEffect, useRef } from 'react';
import AV, { LoveRecord } from './api/leancloud';
import { format, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { Heart, Download, Plus, Star, BarChart3, Calendar, Edit, Trash2, X, Save, Plus as PlusIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ReportTemplate from './components/ReportTemplate';
import Heatmap from './components/Heatmap';

export default function App() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportOptionsVisible, setExportOptionsVisible] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [exportRecords, setExportRecords] = useState([]);
  const [exportType, setExportType] = useState('all');
  const reportRef = useRef();
  
  // 数据管理相关状态
  const [dataManagementVisible, setDataManagementVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [newRecord, setNewRecord] = useState({ date: new Date(), rating: 5 });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const query = new AV.Query('LoveRecord');
      query.limit(1000);
      query.descending('createdAt');
      const results = await query.find();
      setRecords(results.map(r => ({
        id: r.id,
        date: new Date(r.get('date')),
        rating: r.get('rating'),
        note: r.get('note')
      })));
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLoveRecord = async (rating) => {
    try {
      const record = new LoveRecord();
      record.set('date', new Date());
      record.set('rating', rating);
      await record.save();
      fetchData();
      alert('记录成功！❤️');
    } catch (error) {
      console.error('添加记录失败:', error);
      alert('记录失败，请重试！');
    }
  };

  // 添加指定日期的记录
  const addCustomRecord = async (recordData) => {
    try {
      const record = new LoveRecord();
      record.set('date', recordData.date);
      record.set('rating', recordData.rating);
      await record.save();
      fetchData();
      setNewRecord({ date: new Date(), rating: 5 });
      alert('添加成功！❤️');
    } catch (error) {
      console.error('添加记录失败:', error);
      alert('添加失败，请重试！');
    }
  };

  // 修改记录
  const updateRecord = async (recordId, rating) => {
    try {
      const record = AV.Object.createWithoutData('LoveRecord', recordId);
      record.set('rating', rating);
      await record.save();
      fetchData();
      setEditingRecord(null);
      setIsEditing(false);
      alert('修改成功！✅');
    } catch (error) {
      console.error('修改记录失败:', error);
      alert('修改失败，请重试！');
    }
  };

  // 删除记录
  const deleteRecord = async (recordId) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      try {
        const record = AV.Object.createWithoutData('LoveRecord', recordId);
        await record.destroy();
        fetchData();
        alert('删除成功！🗑️');
      } catch (error) {
        console.error('删除记录失败:', error);
        alert('删除失败，请重试！');
      }
    }
  };

  const exportPDF = async (filteredRecords, title) => {
    try {
      const element = reportRef.current;
      
      // 确保元素可见以便捕获
      element.style.opacity = '1';
      element.style.position = 'relative';
      element.style.left = '0';
      element.style.top = '0';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        removeContainer: true
      });
      
      // 恢复元素样式
      element.style.opacity = '0';
      element.style.position = 'fixed';
      element.style.left = '-9999px';
      element.style.top = '0';
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // 处理长内容，自动分页
      if (pdfHeight > pdf.internal.pageSize.getHeight()) {
        const pageHeight = pdf.internal.pageSize.getHeight();
        const totalPages = Math.ceil(pdfHeight / pageHeight);
        
        for (let i = 0; i < totalPages; i++) {
          if (i > 0) {
            pdf.addPage();
          }
          
          const yOffset = -i * pageHeight;
          const height = Math.min(pageHeight, pdfHeight - i * pageHeight);
          
          pdf.addImage(
            imgData, 
            'PNG', 
            0, 
            yOffset, 
            pdfWidth, 
            pdfHeight
          );
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      
      pdf.save(`LoveReport_${title}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (error) {
      console.error('导出PDF失败:', error);
      alert('导出失败，请重试！');
    }
  };

  const handleExport = (type) => {
    let filteredRecords = records;
    let title = '';
    
    switch (type) {
      case 'week':
        const weekStart = startOfWeek(new Date());
        const weekEnd = endOfWeek(new Date());
        filteredRecords = records.filter(r => isWithinInterval(r.date, { start: weekStart, end: weekEnd }));
        title = '本周';
        break;
      case 'month':
        const monthStart = startOfMonth(new Date());
        const monthEnd = endOfMonth(new Date());
        filteredRecords = records.filter(r => isWithinInterval(r.date, { start: monthStart, end: monthEnd }));
        title = '本月';
        break;
      case 'year':
        const yearStart = startOfYear(new Date());
        const yearEnd = endOfYear(new Date());
        filteredRecords = records.filter(r => isWithinInterval(r.date, { start: yearStart, end: yearEnd }));
        title = '本年';
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          filteredRecords = records.filter(r => isWithinInterval(r.date, { start, end }));
          title = '自定义';
        } else {
          alert('请选择自定义日期范围！');
          return;
        }
        break;
      default:
        title = '全部';
    }
    
    setExportRecords(filteredRecords);
    setExportType(type);
    
    // 延迟导出，确保React状态更新完成
    setTimeout(() => {
      exportPDF(filteredRecords, title);
      setExportOptionsVisible(false);
    }, 100);
  };

  const total = records.length;
  const fiveStars = records.filter(r => r.rating === 5).length;
  const avgRating = total > 0 ? (records.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-800 p-4 md:p-10 font-sans selection:bg-pink-200">
      <div className="fixed left-[-9999px] top-0 opacity-0 pointer-events-none">
        <ReportTemplate 
          reportRef={reportRef} 
          records={exportRecords.length > 0 ? exportRecords : records}
          exportType={exportType}
        />
      </div>

      <div className="max-w-5xl mx-auto bg-white/70 backdrop-blur-xl rounded-[24px] shadow-2xl border border-white/50 overflow-hidden">
        <nav className="p-6 border-b border-gray-200/50 flex justify-between items-center relative">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
              <Heart className="fill-pink-500 text-pink-500 animate-pulse" />
              爱计数 <span className="text-sm font-normal text-slate-400">V1.0</span>
            </h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setDataManagementVisible(!dataManagementVisible)}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-pink-50 rounded-full border border-gray-200 transition-all active:scale-95 shadow-sm"
            >
              <Edit size={18} />
              数据管理
            </button>
            <div className="relative">
              <button 
                onClick={() => setExportOptionsVisible(!exportOptionsVisible)}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-pink-50 rounded-full border border-gray-200 transition-all active:scale-95 shadow-sm"
              >
                <Download size={18} />
                导出 PDF 报告
              </button>
              
              {exportOptionsVisible && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-50">
                  <div className="space-y-2">
                    <button 
                      onClick={() => handleExport('week')}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-pink-50 transition-colors text-left"
                    >
                      <Calendar size={16} className="text-pink-500" />
                      导出本周
                    </button>
                    <button 
                      onClick={() => handleExport('month')}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-pink-50 transition-colors text-left"
                    >
                      <Calendar size={16} className="text-pink-500" />
                      导出本月
                    </button>
                    <button 
                      onClick={() => handleExport('year')}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-pink-50 transition-colors text-left"
                    >
                      <Calendar size={16} className="text-pink-500" />
                      导出本年
                    </button>
                    <div className="pt-2 border-t border-gray-100">
                      <div className="space-y-2">
                        <div className="flex flex-col space-y-1">
                          <label className="text-xs text-slate-500">开始日期</label>
                          <input 
                            type="date" 
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500"
                          />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-xs text-slate-500">结束日期</label>
                          <input 
                            type="date" 
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500"
                          />
                        </div>
                        <button 
                          onClick={() => handleExport('custom')}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-pink-50 transition-colors text-left"
                        >
                          <Calendar size={16} className="text-pink-500" />
                          导出自定义
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="grid lg:grid-cols-3 gap-0">
          <div className="lg:col-span-2 p-4 sm:p-8 border-r border-gray-100">
            <Heatmap records={records} />
          </div>

          <div className="p-4 sm:p-8 bg-gray-50/30 space-y-6">
            <section className="bg-white/70 backdrop-blur-md p-5 sm:p-6 rounded-2xl shadow-sm border border-white/50">
              <h3 className="text-sm font-medium text-slate-500 mb-4 flex items-center gap-2">
                <Plus size={16}/>
                快速记录
              </h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {[1, 2, 3, 4, 5].map(score => (
                  <button 
                    key={score}
                    onClick={() => addLoveRecord(score)}
                    className="w-10 h-10 rounded-full border border-pink-100 flex items-center justify-center hover:bg-pink-500 hover:text-white transition-all hover:scale-110 active:scale-90 shadow-sm"
                  >
                    {score}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-[10px] text-slate-400 text-center italic">点击分值（1-5星）立即存入云端</p>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <BarChart3 size={16}/>
                数据洞察
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white/70 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/50 text-center shadow-sm">
                  <div className="text-xl sm:text-2xl font-bold text-pink-500">{total}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">累计次数</div>
                </div>
                <div className="bg-white/70 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/50 text-center shadow-sm">
                  <div className="text-xl sm:text-2xl font-bold text-orange-400">{avgRating}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">平均指数</div>
                </div>
                <div className="bg-white/70 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/50 text-center shadow-sm">
                  <div className="text-xl sm:text-2xl font-bold text-purple-500">{fiveStars}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">五星时刻</div>
                </div>
                <div className="bg-white/70 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/50 text-center shadow-sm">
                  <div className="text-xl sm:text-2xl font-bold text-blue-400">
                    {records.filter(r => {
                      const month = new Date().getMonth();
                      return new Date(r.date).getMonth() === month;
                    }).length}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">本月次数</div>
                </div>
                <div className="bg-white/70 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/50 text-center shadow-sm">
                  <div className="text-xl sm:text-2xl font-bold text-green-400">
                    {records.filter(r => {
                      const weekStart = startOfWeek(new Date());
                      const weekEnd = endOfWeek(new Date());
                      return isWithinInterval(r.date, { start: weekStart, end: weekEnd });
                    }).length}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">本周次数</div>
                </div>
                <div className="bg-white/70 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/50 text-center shadow-sm">
                  <div className="text-xl sm:text-2xl font-bold text-red-400">{records.filter(r => r.rating === 1).length}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">一星时刻</div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* 数据管理模块 */}
        {dataManagementVisible && (
          <div className="p-4 sm:p-8 border-t border-gray-100 bg-gray-50/30">
            <div className="bg-white/70 backdrop-blur-md p-5 sm:p-6 rounded-2xl shadow-sm border border-white/50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-slate-800 flex items-center gap-2">
                  <Edit size={18}/>
                  数据管理
                </h3>
                <button 
                  onClick={() => setDataManagementVisible(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>

              {/* 添加新记录 */}
              <div className="mb-8">
                <h4 className="text-sm font-medium text-slate-500 mb-4 flex items-center gap-2">
                  <PlusIcon size={16}/>
                  添加记录
                </h4>
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500">日期</label>
                      <input 
                        type="date" 
                        value={format(newRecord.date, 'yyyy-MM-dd')}
                        onChange={(e) => setNewRecord({...newRecord, date: new Date(e.target.value)})}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500">评分 (1-5)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="5" 
                        value={newRecord.rating}
                        onChange={(e) => setNewRecord({...newRecord, rating: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => addCustomRecord(newRecord)}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors active:scale-95"
                  >
                    <Save size={16} />
                    保存记录
                  </button>
                </div>
              </div>

              {/* 记录列表 */}
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-4 flex items-center gap-2">
                  <BarChart3 size={16}/>
                  记录列表
                </h4>
                <div className="bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden">
                  {records.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">日期</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">评分</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {records.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50/50">
                              <td className="px-4 py-3 whitespace-nowrap">{format(record.date, 'yyyy-MM-dd')}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      size={14} 
                                      className={i < record.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                                    />
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => {
                                      setEditingRecord(record);
                                      setIsEditing(true);
                                    }}
                                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                  >
                                    <Edit size={14} className="text-slate-600" />
                                  </button>
                                  <button 
                                    onClick={() => deleteRecord(record.id)}
                                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                  >
                                    <Trash2 size={14} className="text-red-500" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-slate-400">
                      暂无记录
                    </div>
                  )}
                </div>
              </div>

              {/* 编辑记录 */}
              {isEditing && editingRecord && (
                <div className="mt-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <h4 className="text-sm font-medium text-slate-500 mb-4">编辑记录</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500">日期</label>
                      <input 
                        type="date" 
                        value={format(editingRecord.date, 'yyyy-MM-dd')}
                        disabled
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-100 focus:outline-none focus:ring-1 focus:ring-pink-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500">评分 (1-5)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="5" 
                        value={editingRecord.rating}
                        onChange={(e) => setEditingRecord({...editingRecord, rating: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button 
                      onClick={() => {
                        updateRecord(editingRecord.id, editingRecord.rating);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors active:scale-95"
                    >
                      <Save size={16} />
                      保存修改
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setEditingRecord(null);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors active:scale-95"
                    >
                      <X size={16} className="text-slate-400" />
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}