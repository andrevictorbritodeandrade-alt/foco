import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Bell, Download, Tag, RefreshCw, Search } from 'lucide-react';
import { TaskCard } from './components/TaskCard';
import { getNaggingMessage, getTaskInsight } from './services/ai';
import { requestNotificationPermission } from './services/firebase';
import { Task, Category } from './types';

const CATEGORIES: Category[] = [
  { id: 'all', name: 'TUDO', color: 'text-white', bgColor: 'bg-indigo-600', iconName: 'LayoutGrid' },
  { id: 'health', name: 'SAÚDE', color: 'text-rose-500', bgColor: 'bg-white', iconName: 'HeartPulse' },
  { id: 'travel', name: 'VIAGEM', color: 'text-cyan-500', bgColor: 'bg-white', iconName: 'Plane' },
  { id: 'car', name: 'CARRO & C...', color: 'text-amber-600', bgColor: 'bg-white', iconName: 'Car' },
  { id: 'personal', name: 'PESSOAL', color: 'text-purple-500', bgColor: 'bg-white', iconName: 'Camera' },
  { id: 'study', name: 'ESTUDO', color: 'text-emerald-500', bgColor: 'bg-white', iconName: 'Book' },
  { id: 'projects', name: 'PROJETOS', color: 'text-indigo-500', bgColor: 'bg-white', iconName: 'Settings' },
  { id: 'general', name: 'GERAL', color: 'text-orange-500', bgColor: 'bg-white', iconName: 'Tag' },
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [nagMessage, setNagMessage] = useState('Carregando sistema...');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    updateNag();
    requestNotificationPermission();
  }, []);

  const updateNag = async () => {
    setLoading(true);
    const msg = await getNaggingMessage(tasks.filter(t => !t.completed));
    setNagMessage(msg);
    setLoading(false);
  };

  const addTask = async () => {
    if (!newTaskText.trim()) return;
    
    const catId = selectedCategory === 'all' ? 'general' : selectedCategory;
    const newTask: Task = {
      id: Date.now(),
      text: newTaskText,
      categoryId: catId,
      completed: false,
      createdAt: Date.now(),
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTaskText('');

    // Adiciona insight da IA automaticamente
    const insight = await getTaskInsight(newTask);
    setTasks(prev => prev.map(t => t.id === newTask.id ? { ...t, insight } : t));
    
    updateNag();
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const filteredTasks = useMemo(() => 
    selectedCategory === 'all' ? tasks : tasks.filter(t => t.categoryId === selectedCategory)
  , [tasks, selectedCategory]);

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  return (
    <div className="min-h-screen bg-[#050a18] text-white pb-20">
      {/* Banner de Ativação */}
      <div className="bg-[#0a1229] py-2 text-center border-b border-white/5">
        <button onClick={requestNotificationPermission} className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 hover:text-white transition-colors">
          Clique aqui para ativar os alertas do coach.
        </button>
      </div>

      <div className="max-w-xl mx-auto px-6 pt-6">
        {/* Progress Bar Section */}
        <div className="bg-white rounded-3xl p-5 mb-10 shadow-lg">
          <div className="flex justify-between items-center mb-3 px-1">
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Meta de André</span>
            <span className="text-xl font-black text-[#050a18]">{progress}%</span>
          </div>
          <div className="h-3 bg-amber-50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-400 transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Header Section */}
        <header className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-500"><Icons.Zap size={14} fill="currentColor" /></span>
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Sistema de Alta Performance</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter mb-2">FOCO<span className="text-amber-500">.</span></h1>
            <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-[180px]">
              André, o sucesso exige consistência.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="p-3 bg-white text-[#050a18] rounded-2xl shadow-lg"><Download size={20} /></button>
            <button onClick={requestNotificationPermission} className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20"><Bell size={20} /></button>
            <button className="p-3 bg-white text-[#050a18] rounded-2xl shadow-lg"><Tag size={20} /></button>
          </div>
        </header>

        {/* Category Grid */}
        <div className="grid grid-cols-4 gap-3 mb-10">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`
                flex flex-col items-center justify-center py-4 rounded-[2rem] transition-all duration-300
                ${selectedCategory === cat.id ? 'bg-indigo-600 shadow-xl shadow-indigo-600/20 scale-105' : 'bg-white'}
              `}
            >
              <div className={`mb-2 ${selectedCategory === cat.id ? 'text-white' : cat.color}`}>
                <DynamicIcon name={cat.iconName} size={22} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider ${selectedCategory === cat.id ? 'text-white' : 'text-slate-900'}`}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>

        {/* Input Field */}
        <div className="relative mb-12 group">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Novo compromisso?"
            className="w-full bg-white rounded-[2.5rem] py-6 pl-8 pr-20 text-[#050a18] font-bold text-lg placeholder-slate-400 focus:outline-none shadow-2xl transition-all"
          />
          <button 
            onClick={addTask}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#050a18] text-white p-4 rounded-full hover:scale-105 transition-transform active:scale-95 shadow-lg"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Task List Header */}
        <div className="flex justify-between items-center mb-6 px-2">
          <div className="flex items-center gap-3">
            <Icons.ListTodo size={18} className="text-amber-500" />
            <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-100">Lista de Foco</h2>
          </div>
          <span className="bg-indigo-600 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
            {tasks.filter(t => !t.completed).length} Ativas
          </span>
        </div>

        {/* List Section */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-10 opacity-20 flex flex-col items-center">
              <Icons.Inbox size={48} className="mb-4" />
              <p className="font-black text-sm uppercase tracking-widest">Nada pendente</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                category={CATEGORIES.find(c => c.id === task.categoryId)}
                onToggle={toggleTask}
                onDelete={deleteTask}
              />
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8">
        <button className="bg-white p-5 rounded-[2rem] shadow-2xl shadow-black/50 hover:scale-110 active:scale-90 transition-all">
          <Icons.BrainCircuit size={28} className="text-[#050a18]" />
        </button>
      </div>
    </div>
  );
}

// Re-using DynamicIcon and Icons for convenience
import * as Icons from 'lucide-react';
const DynamicIcon = ({ name, size = 18 }: { name: string, size?: number }) => {
  const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
  return <IconComponent size={size} />;
};