import React, { useState, useEffect } from 'react';
import { Plus, Bell, RefreshCw } from 'lucide-react';
import { TaskCard } from './components/TaskCard';
import { getNaggingMessage } from './services/ai';
import { requestNotificationPermission } from './services/firebase';
import { Task, Category } from './types';

const CATEGORIES: Category[] = [
  { id: 'work', name: 'TRABALHO', color: 'text-blue-400', iconName: 'Briefcase' },
  { id: 'personal', name: 'PESSOAL', color: 'text-green-400', iconName: 'User' },
  { id: 'health', name: 'SAÚDE', color: 'text-red-400', iconName: 'Heart' },
  { id: 'study', name: 'ESTUDOS', color: 'text-yellow-400', iconName: 'BookOpen' },
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [nagMessage, setNagMessage] = useState('Carregando insultos...');
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

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: Date.now(),
      text: newTaskText,
      categoryId: selectedCategory,
      completed: false,
      createdAt: Date.now(),
      dueDate: new Date(Date.now() + 86400000).toISOString()
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    setNewTaskText('');
    
    // Trigger nag update slightly after adding
    setTimeout(() => {
        getNaggingMessage(updated.filter(t => !t.completed)).then(setNagMessage);
    }, 1000);
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen p-6 pb-24 md:p-12 max-w-2xl mx-auto">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-2">FOCO</h1>
          <p className="text-slate-400 font-medium">Modo Vigilante: <span className="text-emerald-400">ATIVO</span></p>
        </div>
        <button onClick={() => requestNotificationPermission()} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <Bell size={20} />
        </button>
      </header>

      {/* AI Nagging Section */}
      <div className="mb-10 p-6 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
             <button onClick={updateNag} className="text-rose-500 opacity-50 hover:opacity-100">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
             </button>
        </div>
        <p className="text-rose-400 font-bold text-sm uppercase tracking-widest mb-2">Mensagem do Coach</p>
        <p className="text-xl md:text-2xl font-black text-white leading-tight">
          "{nagMessage}"
        </p>
      </div>

      {/* Input Section */}
      <div className="mb-12 space-y-4">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="O que você precisa fazer?"
          className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-6 py-5 text-lg font-bold text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
        />
        
        <div className="flex flex-wrap gap-2 items-center">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`
                px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all
                ${selectedCategory === cat.id ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}
              `}
            >
              {cat.name}
            </button>
          ))}
          <button 
            onClick={addTask}
            className="ml-auto bg-white text-black p-3 md:p-4 rounded-2xl hover:scale-105 transition-transform active:scale-95 flex items-center justify-center"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.length === 0 && (
            <div className="text-center py-20 opacity-30">
                <p className="font-bold">Nenhuma tarefa pendente.</p>
            </div>
        )}
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            category={CATEGORIES.find(c => c.id === task.categoryId)}
            onToggle={toggleTask}
            onDelete={deleteTask}
          />
        ))}
      </div>
    </div>
  );
}