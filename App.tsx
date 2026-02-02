import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Bell, 
  Tag, 
  LayoutGrid,
  HeartPulse,
  Plane,
  Car,
  Camera,
  Book,
  Settings,
  HelpCircle,
  Zap,
  CheckCircle2,
  Loader2,
  Calendar,
  CloudLightning,
  Wifi,
  Download,
  Share,
  X,
  AlertTriangle
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db, signIn } from './services/firebase';
import { TaskCard } from './components/TaskCard';
import { getNaggingMessage, getTaskInsight, getAutoCategory } from './services/ai';
import { requestNotificationPermission } from './services/firebase';
import { Task, Category } from './types';

const Icons: any = LucideIcons;
const CATEGORIES: Category[] = [
  { id: 'all', name: 'TUDO', color: 'text-white', bgColor: 'bg-indigo-600', iconName: 'LayoutGrid' },
  { id: 'health', name: 'SAÚDE', color: 'text-rose-500', bgColor: 'bg-white', iconName: 'HeartPulse' },
  { id: 'travel', name: 'VIAGEM', color: 'text-cyan-500', bgColor: 'bg-white', iconName: 'Plane' },
  { id: 'car', name: 'CASA & CARRO', color: 'text-amber-600', bgColor: 'bg-white', iconName: 'Car' },
  { id: 'personal', name: 'PESSOAL', color: 'text-purple-500', bgColor: 'bg-white', iconName: 'Camera' },
  { id: 'study', name: 'ESTUDO', color: 'text-emerald-500', bgColor: 'bg-white', iconName: 'Book' },
  { id: 'projects', name: 'PROJETOS', color: 'text-indigo-500', bgColor: 'bg-white', iconName: 'Settings' },
  { id: 'general', name: 'GERAL', color: 'text-orange-500', bgColor: 'bg-white', iconName: 'Tag' },
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('foco_tasks_andre');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  
  const [newTaskText, setNewTaskText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [nagMessage, setNagMessage] = useState('Carregando seu destino...');
  const [isAdding, setIsAdding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);

  // UseRef para manter o valor atual de tasks sem causar re-render no useEffect de sync
  const tasksRef = useRef(tasks);
  
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // PWA State
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const progress = useMemo(() => {
    if (tasks.length === 0) return 100;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  // Efeito PWA (Instalação)
  useEffect(() => {
    // Detectar iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Verificar se já está em modo standalone (App instalado)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    if (isStandalone) {
      setShowInstallBanner(false);
      return; // Já está instalado, não faz nada
    }

    // Se for iOS e não estiver instalado, mostra o banner
    if (isIosDevice && !isStandalone) {
      // Pequeno delay para não ser intrusivo imediatamente no load
      setTimeout(() => setShowInstallBanner(true), 2000);
    }

    // Se for Android/Desktop, escuta o evento 'beforeinstallprompt'
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // No iOS não tem prompt programático, mostramos um alerta ou modal com instruções
      alert("Para instalar no iPhone/iPad:\n1. Toque no botão Compartilhar (quadrado com seta)\n2. Selecione 'Adicionar à Tela de Início'");
    } else if (installPrompt) {
      // Android/Desktop
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setInstallPrompt(null);
    }
  };

  // Efeito para conectar ao Firestore com Autenticação
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const connectToCloud = async () => {
      setIsSyncing(true);
      try {
        // 1. Tenta autenticar. Se falhar, segue em frente (soft fail).
        await signIn();
        
        const andreTasksDoc = doc(db, "users_data", "andre_tasks");
        
        // 2. Escuta mudanças no banco
        unsubscribe = onSnapshot(andreTasksDoc, (docSnap) => {
          setSyncError(false); // Sucesso na conexão com DB
          
          if (docSnap.exists()) {
            // Nuvem tem dados -> Baixa e atualiza local
            const cloudTasks = docSnap.data().tasks || [];
            // Só atualiza se for diferente para evitar loops
            if (JSON.stringify(cloudTasks) !== JSON.stringify(tasksRef.current)) {
              setTasks(cloudTasks);
              localStorage.setItem('foco_tasks_andre', JSON.stringify(cloudTasks));
            }
            setIsSyncing(true);
            setTimeout(() => setIsSyncing(false), 800);
          } else {
            // Nuvem está vazia.
            // Se tivermos dados locais, faz upload inicial.
            if (tasksRef.current.length > 0) {
              console.log("Upload inicial dos dados locais para nuvem...");
              setDoc(andreTasksDoc, { tasks: tasksRef.current }).catch(e => {
                 console.error("Falha no upload inicial (Permissão?)", e);
                 setSyncError(true);
              });
            }
            setIsSyncing(false);
          }
        }, (error) => {
          // Erro REAL do Firestore (ex: sem permissão ou sem internet)
          console.error("Erro de conexão Firestore:", error);
          setSyncError(true);
          setIsSyncing(false);
        });

      } catch (err) {
        // Erro genérico de setup (raro)
        console.error("Erro no setup:", err);
        // Não setamos syncError aqui para não assustar o usuário se for apenas auth falhando
        setIsSyncing(false);
      }
    };

    connectToCloud();
    requestNotificationPermission();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []); // Executa apenas uma vez no mount

  useEffect(() => {
    const timer = setTimeout(() => updateNag(), 1500);
    return () => clearTimeout(timer);
  }, [tasks.length, tasks.filter(t => t.completed).length]);

  const updateNag = async () => {
    try {
      const msg = await getNaggingMessage(tasks.filter(t => !t.completed));
      setNagMessage(msg);
    } catch (e) {
      console.error(e);
    }
  };

  const syncToCloud = async (newTasks: Task[]) => {
    setIsSyncing(true);
    // Não limpa erro aqui para não piscar, deixa o sucesso limpar
    try {
      // Tenta garantir auth antes de salvar, mas não bloqueia
      await signIn(); 
      await setDoc(doc(db, "users_data", "andre_tasks"), { tasks: newTasks });
      setSyncError(false); // Sucesso limpa o erro
      setTimeout(() => setIsSyncing(false), 500);
    } catch (e) {
      console.error("Erro ao sincronizar:", e);
      setSyncError(true);
      setIsSyncing(false);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTaskText.trim();
    if (!text || isAdding) return;
    
    setIsAdding(true);
    
    try {
      const autoCategoryId = await getAutoCategory(text);
      
      const newTask: Task = {
        id: Date.now(),
        text: text,
        categoryId: autoCategoryId,
        completed: false,
        createdAt: Date.now(),
        dueDate: dueDate || undefined,
      };

      const updatedTasks = [newTask, ...tasks];
      // Atualiza localmente imediatamente
      setTasks(updatedTasks);
      setNewTaskText('');
      setDueDate('');
      localStorage.setItem('foco_tasks_andre', JSON.stringify(updatedTasks));
      
      // Sobe para a nuvem
      await syncToCloud(updatedTasks);

      const insight = await getTaskInsight(newTask);
      if (insight) {
        const withInsight = updatedTasks.map(t => t.id === newTask.id ? { ...t, insight } : t);
        setTasks(withInsight);
        await syncToCloud(withInsight);
      }
    } catch (e) {
      console.error("Erro ao adicionar tarefa", e);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleTask = async (id: number) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updatedTasks);
    localStorage.setItem('foco_tasks_andre', JSON.stringify(updatedTasks));
    await syncToCloud(updatedTasks);
  };

  const deleteTask = async (id: number) => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    localStorage.setItem('foco_tasks_andre', JSON.stringify(updatedTasks));
    await syncToCloud(updatedTasks);
  };

  const filteredTasks = tasks.filter(t => selectedCategory === 'all' || t.categoryId === selectedCategory);

  return (
    <div className="min-h-screen pb-32 px-3 sm:px-6 pt-12 max-w-2xl mx-auto overflow-x-hidden relative">
      
      {/* INDICADOR DE STATUS DA NUVEM */}
      <div className={`absolute top-4 right-4 flex items-center gap-1.5 backdrop-blur-sm px-2.5 py-1.5 rounded-full border shadow-lg z-40 transition-colors duration-300 ${syncError ? 'bg-red-900/80 border-red-500/50' : 'bg-slate-900/80 border-white/10'}`}>
        <div className={`relative flex items-center justify-center w-2 h-2`}>
          {syncError ? (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          ) : isSyncing ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          )}
        </div>
        <span className={`text-[9px] font-black uppercase tracking-widest ${syncError ? 'text-red-400' : isSyncing ? 'text-amber-400' : 'text-slate-500'}`}>
          {syncError ? 'FALHA SYNC' : isSyncing ? 'SINCRONIZANDO...' : 'NUVEM ON'}
        </span>
        {syncError ? <AlertTriangle size={10} className="text-red-500 ml-0.5" /> : !isSyncing && <Wifi size={10} className="text-emerald-500/50 ml-0.5" />}
      </div>

      {/* Header com Coach e Barra de Progresso */}
      <div className="mb-10 text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
          <Zap size={14} className="text-indigo-400 fill-indigo-400" />
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Inteligência Vigilante</span>
        </div>
        
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase leading-none tracking-tighter text-white min-h-[4.5rem] flex items-center justify-center px-2">
          {nagMessage}
        </h1>

        <div className="bg-slate-900/50 p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 space-y-4 shadow-2xl">
          <div className="flex justify-between items-end mb-1">
            <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">Execução Diária</span>
            <span className="text-xl sm:text-2xl font-black text-indigo-400">{progress}%</span>
          </div>
          <div className="h-3.5 sm:h-4 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 sm:p-1 border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 to-cyan-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(79,70,229,0.3)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 italic">
            {progress === 100 ? "Você é o mestre da execução hoje." : "Cada tarefa concluída é um passo rumo ao topo."}
          </p>
        </div>
      </div>

      {/* Filtro de Categorias */}
      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`
              flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full transition-all duration-300 border
              ${selectedCategory === cat.id 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}
            `}
          >
            {React.createElement(Icons[cat.iconName] || HelpCircle, { size: 12 })}
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Input de Nova Tarefa com IA e Data */}
      <form onSubmit={addTask} className="space-y-4 mb-10">
        <div className="relative group">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="O QUE VAMOS EXECUTAR?"
            disabled={isAdding}
            className="w-full bg-white text-[#050a18] rounded-[2rem] sm:rounded-[2.5rem] py-5 sm:py-6 pl-6 sm:pl-8 pr-16 sm:pr-20 text-[12px] sm:text-[13px] font-black uppercase placeholder:text-slate-300 focus:outline-none shadow-xl border-2 sm:border-4 border-transparent focus:border-indigo-500/20 transition-all disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={!newTaskText.trim() || isAdding}
            className="absolute right-2 sm:right-3 top-2 sm:top-3 bottom-2 sm:bottom-3 w-11 sm:w-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {isAdding ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
          </button>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4 bg-white/5 p-3 sm:p-4 rounded-[1.2rem] sm:rounded-[1.5rem] border border-white/10">
          <Calendar size={16} className="text-indigo-400 shrink-0" />
          <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest shrink-0">Prazo (Opcional):</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="bg-transparent text-white text-[11px] sm:text-[12px] font-bold outline-none flex-1 custom-date-input"
          />
        </div>
      </form>

      {/* Lista de Tarefas */}
      <div className="space-y-4 sm:space-y-5">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              category={CATEGORIES.find(c => c.id === task.categoryId)}
              onToggle={toggleTask}
              onDelete={deleteTask}
            />
          ))
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto border border-white/5">
              <CheckCircle2 size={28} className="text-slate-700" />
            </div>
            <p className="text-slate-500 text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-4">A lista está vazia. Comece a agir agora.</p>
          </div>
        )}
      </div>

      {/* BANNER DE INSTALAÇÃO PWA */}
      {showInstallBanner && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-[slideUp_0.5s_ease-out]">
          <div className="max-w-xl mx-auto bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <Download size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wide">Instalar FOCO App</p>
                <p className="text-[10px] text-slate-400">Acesso rápido e offline</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowInstallBanner(false)}
                className="p-2 rounded-full hover:bg-white/5 transition-colors"
              >
                <X size={18} className="text-slate-400" />
              </button>
              <button 
                onClick={handleInstallClick}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
              >
                {isIOS ? 'Como Instalar' : 'Instalar Agora'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerta Flutuante (Tarefas Pendentes) */}
      {tasks.some(t => !t.completed) && !showInstallBanner && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full flex items-center gap-2 sm:gap-3 shadow-2xl animate-bounce border-2 border-indigo-400 z-40 whitespace-nowrap overflow-hidden max-w-[90vw]">
          <Bell size={14} fill="white" className="shrink-0" />
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter truncate">ANDRÉ, EXECUTAR É PRECISO!</span>
        </div>
      )}
    </div>
  );
}