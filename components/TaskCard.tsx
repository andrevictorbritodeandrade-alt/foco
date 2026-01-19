import React from 'react';
import { 
  Trash2, 
  AlertCircle,
  Clock,
  HelpCircle,
  Info
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { Task, Category } from '../types';

interface TaskCardProps {
  task: Task;
  category?: Category;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

const DynamicIcon = ({ name, className, size = 18 }: { name: string, className?: string, size?: number }) => {
  const IconComponent = (Icons as any)[name] || HelpCircle;
  return <IconComponent className={className} size={size} />;
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, category, onToggle, onDelete }) => {
  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
  
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div 
      className={`
        relative overflow-hidden group transition-all duration-400 transform
        ${task.completed ? 'bg-white/15 border-white/5 opacity-40 scale-[0.97]' : 'bg-white border-transparent shadow-[0_15px_40px_rgba(0,0,0,0.4)] hover:-translate-y-1.5 active:scale-[0.98]'}
        rounded-[2.8rem] p-6 cursor-pointer border
      `}
      onClick={() => onToggle(task.id)}
    >
      <div className="flex items-center gap-6">
        {/* Toggle Switch */}
        <div className="flex-shrink-0">
          <div 
            className={`
              w-14 h-7 rounded-full p-1 transition-all duration-500
              ${task.completed ? 'bg-emerald-500' : 'bg-slate-200'}
            `}
          >
            <div 
              className={`
                w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-500 ease-in-out
                ${task.completed ? 'translate-x-7' : 'translate-x-0'}
              `}
            />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {category && (
              <span className={`flex-shrink-0 ${task.completed ? 'text-emerald-400' : category.color}`}>
                <DynamicIcon name={category.iconName} size={18} />
              </span>
            )}
            <p className={`text-lg font-black truncate leading-none transition-all ${task.completed ? 'text-slate-400 line-through' : 'text-[#050a18]'}`}>
              {task.text}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {task.dueDate && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase ${isOverdue ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                {isOverdue ? <AlertCircle size={12} /> : <Clock size={12} />}
                {formatTime(task.dueDate)}
              </div>
            )}
            {category && !task.completed && (
              <div className="px-3 py-1.5 rounded-2xl text-[9px] font-black bg-slate-50 text-slate-400 uppercase tracking-[0.15em]">
                {category.name}
              </div>
            )}
          </div>
          
          {task.note && !task.completed && (
            <div className="mt-3 flex items-start gap-2 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/50">
              <Info size={14} className="text-indigo-600 mt-0.5 shrink-0" />
              <p className="text-[11px] font-bold text-indigo-700 leading-tight italic">{task.note}</p>
            </div>
          )}
        </div>

        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            if(confirm('Apagar esta tarefa?')) onDelete(task.id); 
          }}
          className="p-4 rounded-3xl text-slate-100 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90"
        >
          <Trash2 size={24} />
        </button>
      </div>
    </div>
  );
};