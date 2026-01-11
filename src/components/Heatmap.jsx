import React, { useMemo, useEffect } from 'react';
import { startOfYear, endOfYear, eachDayOfInterval, format, isSameDay, startOfWeek, addWeeks } from 'date-fns';

const Heatmap = ({ records }) => {
  const startDate = startOfYear(new Date());
  const endDate = endOfYear(new Date());
  
  // 添加自定义滚动条样式
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* 自定义滚动条样式 */
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
      }
      
      .custom-scrollbar::-webkit-scrollbar {
        height: 4px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(156, 163, 175, 0.3);
        border-radius: 20px;
        border: transparent;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: rgba(156, 163, 175, 0.5);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // 预计算每天的记录次数，提高性能
  const dayCounts = useMemo(() => {
    const counts = {};
    records.forEach(record => {
      const dateStr = format(record.date, 'yyyy-MM-dd');
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });
    return counts;
  }, [records]);

  // 获取每天的强度等级
  const getIntensityClass = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const count = dayCounts[dateStr] || 0;
    
    if (count === 0) return 'bg-slate-100 hover:bg-slate-200';
    if (count === 1) return 'bg-pink-100 hover:bg-pink-200';
    if (count === 2) return 'bg-pink-200 hover:bg-pink-300';
    if (count === 3) return 'bg-pink-300 hover:bg-pink-400';
    if (count === 4) return 'bg-pink-400 hover:bg-pink-500';
    return 'bg-pink-600 hover:bg-pink-700';
  };

  // 生成周数据
  const generateWeeks = () => {
    const weeks = [];
    let currentWeekStart = startOfWeek(startDate, { weekStartsOn: 1 }); // 周一开始
    
    while (currentWeekStart <= endDate) {
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(currentWeekStart);
        day.setDate(currentWeekStart.getDate() + i);
        if (day >= startDate && day <= endDate) {
          weekDays.push(day);
        }
      }
      weeks.push(weekDays);
      currentWeekStart = addWeeks(currentWeekStart, 1);
    }
    
    return weeks;
  };

  const weeks = generateWeeks();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold">年度甜蜜图谱</h2>
        <div className="flex gap-2 text-xs items-center text-slate-400">
          Less <div className="w-3 h-3 bg-white/40 border border-slate-200 rounded-sm"></div>
          <div className="w-3 h-3 bg-pink-100 rounded-sm"></div>
          <div className="w-3 h-3 bg-pink-300 rounded-sm"></div>
          <div className="w-3 h-3 bg-pink-500 rounded-sm"></div>
          <div className="w-3 h-3 bg-pink-700 rounded-sm"></div> More
        </div>
      </div>
      
      <div className="overflow-x-auto pb-4">
        <div className="min-w-max custom-scrollbar">
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const count = dayCounts[dateStr] || 0;
                  
                  return (
                    <div 
                      key={day.toString()} 
                      className={`w-3 h-3 rounded-sm transition-all duration-200 ${getIntensityClass(day)} border border-slate-100 hover:border-slate-300`}
                      title={`${format(day, 'yyyy年MM月dd日')}: ${count} 次`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 月份标签 */}
      <div className="flex justify-between text-xs text-slate-500 mt-2">
        {(() => {
          const months = [];
          const weekStarts = [];
          
          // 计算每周的开始日期
          let currentWeekStart = startOfWeek(startDate, { weekStartsOn: 1 });
          while (currentWeekStart <= endDate) {
            weekStarts.push(new Date(currentWeekStart));
            currentWeekStart = addWeeks(currentWeekStart, 1);
          }
          
          // 找到每个月第一个周的索引
          const monthWeekMap = {};
          weekStarts.forEach((weekStart, index) => {
            const monthKey = format(weekStart, 'yyyy-MM');
            if (!monthWeekMap[monthKey]) {
              monthWeekMap[monthKey] = index;
            }
          });
          
          // 生成月份标签，确保与周网格对齐
          const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
          const currentYear = format(new Date(), 'yyyy');
          
          for (let i = 0; i < 12; i++) {
            const monthDate = new Date(`${currentYear}-${String(i + 1).padStart(2, '0')}-01`);
            const monthKey = format(monthDate, 'yyyy-MM');
            if (monthWeekMap[monthKey] !== undefined) {
              months.push({
                name: monthNames[i],
                weekIndex: monthWeekMap[monthKey]
              });
            }
          }
          
          return months.map((month, index) => (
            <div key={index} className="flex-1 text-center">
              {month.name}
            </div>
          ));
        })()}
      </div>
    </div>
  );
};

export default Heatmap;