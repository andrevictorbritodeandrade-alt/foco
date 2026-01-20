import React from 'react';
import { Trash2, HelpCircle, Sparkles } from 'lucide-react';
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

export const TaskCard: React.FC<TaskCardProps> = ({ task, category, onToggle, onDelete }) => {
  return (
    <div 
      className={`
        relative overflow-hidden transition-all duration-500
        ${task.completed ? 'opacity-40 scale-[0.98] bg-slate-800/20 border-white/5' : 'bg-white shadow-[0_12px_25px_rgba(0,0,0,0.25)]'}
        rounded-[2.5rem] p-6 border border-transparent
      `}
    >
      <div className="flex items-start gap-5">
        {/* Toggle Switch */}
        <div 
          onClick={() => onToggle(task.id)}
          className={`
            w-12 h-7 rounded-full p-1 cursor-pointer transition-all duration-500 flex items-center relative mt-1 shrink-0
            ${task.completed ? 'bg-indigo-500' : 'bg-slate-100'}
          `}
        >
          <div 
            className={`
              w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-500
              ${task.completed ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </div>
        
        <div className="flex-1 min-w-0" onClick={() => onToggle(task.id)}>
          <div className="flex items-center gap-2 mb-1.5">
            {category && (
              <span className={`flex-shrink-0 ${task.completed ? 'text-white' : category.color}`}>
                <DynamicIcon name={category.iconName} size={14} />
              </span>
            )}
            {/* Texto da tarefa: SEM TRUNCATE para ler tudo */}
            <p className={`text-[15px] font-black uppercase tracking-tight break-words transition-all leading-tight ${task.completed ? 'text-slate-400 line-through' : 'text-[#050a18]'}`}>
              {task.text}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {category && (
              <div className="px-2.5 py-1 bg-slate-50 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                {category.name}
              </div>
            )}
          </div>

          {/* Balão de Dica da IA (Insight) */}
          {task.insight && !task.completed && (
            <div className="mt-4 flex items-start gap-2.5 bg-indigo-50/80 p-3 rounded-2xl border border-indigo-100/50">
              <div className="bg-white p-1.5 rounded-lg text-indigo-500 shadow-sm flex items-center justify-center shrink-0">
                <Sparkles size={11} fill="currentColor" />
              </div>
              <p className="text-[11px] font-bold text-indigo-900 leading-snug italic break-words">
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
          className="p-2 text-slate-200 hover:text-rose-500 transition-colors shrink-0"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};