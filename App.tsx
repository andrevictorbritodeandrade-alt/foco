import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Bell, 
  Download, 
  Tag, 
  RefreshCw, 
  Zap, 
  ListTodo, 
  Inbox, 
  BrainCircuit,
  LayoutGrid,
  HeartPulse,
  Plane,
  Car,
  Camera,
  Book,
  Settings,
  HelpCircle
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { doc, setDoc, getDoc, onSnapshot, collection } from "firebase/firestore";
import { db } from './services/firebase';
import { TaskCard } from './components/TaskCard';
import { getNaggingMessage, getTaskInsight } from './services/ai';
import { requestNotificationPermission } from './services/firebase';
import { Task, Category } from './types';

const Icons: any = LucideIcons;
const CATEGORIES: Category[] = [
  { id: 'all', name: 'TUDO', color: 'text-white', bgColor: 'bg-indigo-600', iconName: 'LayoutGrid' },
  { id: 'health', name: 'SAÚDE', color: 'text-rose-500', bgColor: 'bg-white', iconName: 'HeartPulse' },
  { id: 'travel', name: 'VIAGEM', color: 'text-cyan-500', bgColor: 'bg-white', iconName: 'Plane' },
  { id: 'car', name: 'CARRO & CASA', color: 'text-amber-600', bgColor: 'bg-white', iconName: 'Car' },
  { id: 'personal', name: 'PESSOAL', color: 'text-purple-500', bgColor: 'bg-white', iconName: 'Camera' },
  { id: 'study', name: 'ESTUDO', color: 'text-emerald-500', bgColor: 'bg-white', iconName: 'Book' },
  { id: 'projects', name: 'PROJETOS', color: 'text-indigo-500', bgColor: 'bg-white', iconName: 'Settings' },
  { id: 'general', name: 'GERAL', color: 'text-orange-500', bgColor: 'bg-white', iconName: 'Tag' },
];

const DynamicIcon = ({ name, size = 18 }: { name: string, size?: number }) => {
  const IconComponent = Icons[name] || HelpCircle;
  return <IconComponent size={size} />;
};

export default function App() {
  // Inicializa o estado com LocalStorage como cache rápido
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('foco_tasks_andre');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [nagMessage, setNagMessage] = useState('Carregando seu destino...');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Escuta o Firestore para atualizações em tempo real (Nuvem)
  useEffect(() => {
    setSyncing(true);
    const andreTasksDoc = doc(db, "users_data", "andre_tasks");
    
    const unsubscribe = onSnapshot(andreTasksDoc, (docSnap) => {
      if (docSnap.exists()) {
        const cloudTasks = docSnap.data().tasks || [];
        setTasks(cloudTasks);
        localStorage.setItem('foco_tasks_andre', JSON.stringify(cloudTasks));
      }
      setSyncing(false);
    });

    requestNotificationPermission();
    return () => unsubscribe();
  }, []);

  // Atualiza o Nag Message quando as tarefas mudam
  useEffect(() => {
    const timer = setTimeout(() => updateNag(), 1000);
    return () => clearTimeout(timer);
  }, [tasks.length]);

  const updateNag = async () => {
    setLoading(true);
    try {
      const msg = await getNaggingMessage(tasks.filter(t => !t.completed));
      setNagMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const syncToCloud = async (newTasks: Task[]) => {
    try {
      await setDoc(doc(db, "users_data", "andre_tasks"), { tasks: newTasks });
    } catch (e) {
      console.error("Erro ao sincronizar com a nuvem:", e);
    }
  };

  const addTask = async () => {
    const text = newTaskText.trim();
    if (!text) return;
    
    const catId = selectedCategory === 'all' ? 'general' : selectedCategory;
    const newTask: Task = {
      id: Date.now(),
      text: text,
      categoryId: catId,
      completed: false,
      createdAt: Date.now(),
    };

    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    setNewTaskText('');
    
    // Salva local e na nuvem
    localStorage.setItem('foco_tasks_andre', JSON.stringify(updatedTasks));
    await syncToCloud(updatedTasks);

    try {
      const insight = await getTaskInsight(newTask);
      if (insight) {
        const withInsight = updatedTasks.map(t => t.id === newTask.id ? { ...t, insight } : t);
        setTasks(withInsight);
        await syncToCloud(withInsight);
      }
    } catch (e) {
      console.error("Erro ao carregar insight", e);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTask();
  };

  const toggleTask = async (id: number) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updatedTasks);
    await syncToCloud(updatedTasks);
  };

  const deleteTask = async (id: number) => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    await syncToCloud(updatedTasks);
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
    <div className="min-h-screen bg-[#050a18] text-white pb-24 overflow-x-hidden">
      {/* Indicador de Nuvem */}
      <div className="bg-[#0a1229] py-2.5 text-center border-b border-white/5 sticky top-0 z-50 flex justify-center items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${syncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
        <span className="text-[9px] font-black tracking-[0.2em] uppercase text-slate-400">
          {syncing ? 'SINCRONIZANDO NUVEM...' : 'BACKUP ATIVO'}
        </span>
      </div>

      <div className="max-w-xl mx-auto px-6 pt-6">
        <div className="bg-white rounded-3xl p-5 mb-10 shadow-lg">
          <div className="flex justify-between items-center mb-3 px-1">
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">META DE ANDRÉ</span>
            <span className="text-xl font-black text-[#050a18]">{progress}%</span>
          </div>
          <div className="h-3 bg-amber-50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-400 transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <header className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap size={14} className="text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">SISTEMA DE ALTA PERFORMANCE</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter mb-2">FOCO<span className="text-amber-500">.</span></h1>
            
            <div className="mt-4 bg-indigo-900/40 border border-indigo-500/30 p-4 rounded-2xl relative">
              <div className="absolute -top-2 left-4 w-4 h-4 bg-indigo-900/40 border-l border-t border-indigo-500/30 rotate-45"></div>
              <p className="text-indigo-200 text-[13px] font-bold italic leading-snug">
                "{nagMessage}"
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 ml-4">
            <button type="button" className="p-3.5 bg-white text-[#050a18] rounded-2xl shadow-lg hover:bg-slate-50 transition-colors"><Download size={20} /></button>
            <button type="button" onClick={requestNotificationPermission} className="p-3.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-colors"><Bell size={20} /></button>
          </div>
        </header>

        <div className="grid grid-cols-4 gap-3 mb-10">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`
                flex flex-col items-center justify-center py-5 rounded-[2.2rem] transition-all duration-300
                ${selectedCategory === cat.id ? 'bg-indigo-600 shadow-xl shadow-indigo-600/30 scale-105' : 'bg-white hover:bg-slate-50'}
              `}
            >
              <div className={`mb-2.5 ${selectedCategory === cat.id ? 'text-white' : cat.color}`}>
                <DynamicIcon name={cat.iconName} size={22} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-wider text-center px-1 leading-tight ${selectedCategory === cat.id ? 'text-white' : 'text-slate-900'}`}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={handleFormSubmit} className="relative mb-12">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Qual o próximo passo?"
            className="w-full bg-white rounded-[2.5rem] py-6 pl-8 pr-20 text-[#050a18] font-bold text-lg placeholder-slate-400 focus:outline-none shadow-2xl"
          />
          <button 
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#050a18] text-white p-4 rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg z-30 flex items-center justify-center"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </form>

        <div className="flex justify-between items-center mb-6 px-2">
          <div className="flex items-center gap-3">
            <ListTodo size={18} className="text-amber-500" />
            <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-100">LISTA DE FOCO</h2>
          </div>
          <span className="bg-indigo-600 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-wider">
            {tasks.filter(t => !t.completed).length} ATIVAS
          </span>
        </div>

        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 opacity-20 flex flex-col items-center">
              <Inbox size={48} className="mb-4" />
              <p className="font-black text-sm uppercase tracking-widest">Nada pendente na nuvem.</p>
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

      <div className="fixed bottom-8 right-8 z-40">
        <button 
          onClick={updateNag}
          className={`
            bg-white p-5 rounded-[2rem] shadow-2xl shadow-black/50 hover:scale-110 active:scale-90 transition-all group
            ${loading ? 'animate-pulse' : ''}
          `}
        >
          <BrainCircuit size={28} className="text-[#050a18]" />
        </button>
      </div>
    </div>
  );
}