import React from 'react';
import { Trash2, HelpCircle, Info } from 'lucide-react';
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
  return (
    <div 
      className={`
        relative overflow-hidden transition-all duration-500
        ${task.completed ? 'opacity-40 scale-[0.98] bg-slate-800/50 border-white/5' : 'bg-white shadow-[0_10px_30px_rgba(0,0,0,0.3)]'}
        rounded-[2.8rem] p-6 border border-transparent
      `}
    >
      <div className="flex items-center gap-5">
        {/* Toggle Switch */}
        <div 
          onClick={() => onToggle(task.id)}
          className={`
            w-14 h-8 rounded-full p-1 cursor-pointer transition-all duration-500 flex items-center
            ${task.completed ? 'bg-indigo-500' : 'bg-slate-200'}
          `}
        >
          <div 
            className={`
              w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-500
              ${task.completed ? 'translate-x-6' : 'translate-x-0'}
            `}
          />
        </div>
        
        <div className="flex-1 min-w-0" onClick={() => onToggle(task.id)}>
          <div className="flex items-center gap-2 mb-1">
            {category && (
              <span className={`flex-shrink-0 ${task.completed ? 'text-white' : category.color}`}>
                <DynamicIcon name={category.iconName} size={14} />
              </span>
            )}
            <p className={`text-[13px] font-black uppercase tracking-tight truncate transition-all ${task.completed ? 'text-slate-400 line-through' : 'text-[#050a18]'}`}>
              {task.text}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {category && (
              <div className="px-3 py-1 bg-slate-50 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest">
                {category.name}
              </div>
            )}
          </div>

          {/* AI Insight Bubble (as shown in screenshot) */}
          {task.insight && !task.completed && (
            <div className="mt-4 flex items-start gap-2 bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100/50">
              <div className="bg-white p-1 rounded-lg text-indigo-500 shadow-sm">
                <Icons.Sparkles size={10} />
              </div>
              <p className="text-[10px] font-bold text-indigo-800 leading-tight italic">
                Dica: {task.insight}
              </p>
            </div>
          )}
        </div>

        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            if(confirm('Apagar tarefa?')) onDelete(task.id); 
          }}
          className="p-3 text-slate-100 hover:text-rose-500 transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
};