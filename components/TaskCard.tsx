import React from 'react';
import { Trash2, HelpCircle, Sparkles, Calendar } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Task, Category } from '../types';

interface TaskCardProps {
  task: Task;
  category?: Category;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

const Icons: any = LucideIcons;

const DynamicIcon = ({ name, className, size = 18 }: { name: string, className?: string, size?: number }) => {
  const IconComponent = Icons[name] || HelpCircle;
  return <IconComponent className={className} size={size} />;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, category, onToggle, onDelete }) => {
  return (
    <div 
      className={`
        relative overflow-hidden transition-all duration-500
        ${task.completed ? 'opacity-50 scale-[0.98] bg-slate-800/10 border-white/5 shadow-none' : 'bg-white shadow-[0_10px_20px_rgba(0,0,0,0.2)]'}
        rounded-[1.8rem] sm:rounded-[2.5rem] p-4 sm:p-6 border border-transparent group
      `}
    >
      <div className="flex items-start gap-3 sm:gap-5">
        {/* Toggle Switch */}
        <div 
          onClick={() => onToggle(task.id)}
          className={`
            w-10 sm:w-12 h-6 sm:h-7 rounded-full p-0.5 sm:p-1 cursor-pointer transition-all duration-500 flex items-center relative mt-0.5 sm:mt-1 shrink-0
            ${task.completed ? 'bg-indigo-500' : 'bg-slate-100'}
          `}
        >
          <div 
            className={`
              w-4.5 sm:w-5 h-4.5 sm:h-5 bg-white rounded-full shadow-md transform transition-transform duration-500
              ${task.completed ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'}
            `}
          />
        </div>
        
        <div className="flex-1 min-w-0" onClick={() => onToggle(task.id)}>
          <div className="flex items-center gap-1.5 mb-1.5 overflow-hidden">
            {category && (
              <span className={`flex-shrink-0 ${task.completed ? 'text-slate-400' : category.color}`}>
                <DynamicIcon name={category.iconName} size={12} />
              </span>
            )}
            <p className={`text-sm sm:text-[15px] font-black uppercase tracking-tight break-words transition-all leading-tight ${task.completed ? 'text-slate-400 line-through' : 'text-[#050a18]'}`}>
              {task.text}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {category && (
              <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-slate-50 rounded-md sm:rounded-lg text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 whitespace-nowrap">
                {category.name}
              </div>
            )}
            {task.dueDate && (
              <div className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[7px] sm:text-[8px] font-black uppercase tracking-widest border whitespace-nowrap ${task.completed ? 'bg-slate-800/10 text-slate-400 border-white/5' : 'bg-indigo-50 text-indigo-500 border-indigo-100'}`}>
                <Calendar size={9} className="shrink-0" />
                <span>Prazo: {formatDate(task.dueDate)}</span>
              </div>
            )}
          </div>

          {/* Balão de Dica da IA (Insight) */}
          {task.insight && !task.completed && (
            <div className="mt-3 sm:mt-4 flex items-start gap-2 bg-indigo-50/70 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-indigo-100/40">
              <div className="bg-white p-1 rounded-md sm:rounded-lg text-indigo-500 shadow-sm flex items-center justify-center shrink-0">
                <Sparkles size={10} fill="currentColor" />
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-indigo-900/80 leading-snug italic break-words pr-2">
                {task.insight}
              </p>
            </div>
          )}
        </div>

        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            if(confirm('Apagar esta tarefa?')) onDelete(task.id); 
          }}
          className="p-1.5 sm:p-2 text-slate-200 hover:text-rose-500 transition-colors shrink-0"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};