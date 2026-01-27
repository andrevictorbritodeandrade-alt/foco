
import React, { useState, useEffect, useMemo } from 'react';
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
  CloudOff,
  Download
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from './services/firebase';
import { TaskCard } from './components/TaskCard';
import { getNaggingMessage, getTaskInsight, getAutoCategory } from './services/ai';
import { requestNotificationPermission } from './services/firebase';
import { Task, Category } from './types';

const Icons: any = LucideIcons;

// LISTA DEFINITIVA EXTRAÍDA DA IMAGEM DO ANDRÉ
const IMAGE_TASKS_DATA: Task[] = [
  { id: 101, text: "VER O PORQUE MEU PLANO LATAM PASS NÃO RENOVOU", categoryId: "general", completed: false, createdAt: 1710000000101, insight: "Foco no objetivo!" },
  { id: 102, text: "COMPRAR LIXA DE FERRO", categoryId: "car", completed: true, createdAt: 1710000000102 },
  { id: 103, text: "COMPRAR TEKBOND 200", categoryId: "car", completed: true, createdAt: 1710000000103 },
  { id: 104, text: "VER ENFORCA-GATO", categoryId: "car", completed: true, createdAt: 1710000000104 },
  { id: 105, text: "COMPRAR COISAS DE COMER PARA LEVAR NA VIAGEM", categoryId: "travel", completed: true, createdAt: 1710000000105 },
  { id: 106, text: "COLOCAR O FOCO APP PARA FUNCIONAR OFF-LINE", categoryId: "projects", completed: true, createdAt: 1710000000106 },
  { id: 107, text: "COMPRAR REMÉDIOS PARA FARMACINHA DA VIAGEM", categoryId: "general", completed: true, createdAt: 1710000000107 },
  { id: 108, text: "PEGAR SACOLA RETORNÁVEL DE MERCADO E COLOCAR NA MALA", categoryId: "general", completed: true, createdAt: 1710000000108 },
  { id: 109, text: "AMOLAR A TESOURA DE CABELO EM SANTA CRUZ", categoryId: "general", completed: true, createdAt: 1710000000109 },
  { id: 110, text: "PLANEJAR AS VIAGENS DE UBER/BOLT JÁ NA ÁFRICA", categoryId: "travel", completed: true, createdAt: 1710000000110 },
  { id: 111, text: "COLOCAR AS INFORMAÇÕES QUE FALTAM DE ESTADIAS NO APP DA VIAGEM", categoryId: "general", completed: true, createdAt: 1710000000111 },
  { id: 112, text: "PEGAR A BOTA EMBAIXO DA CAMA", categoryId: "general", completed: true, createdAt: 1710000000112 },
  { id: 113, text: "LEVAR MINHA PIMENTA PRA VIAGEM", categoryId: "travel", completed: true, createdAt: 1710000000113 },
  { id: 114, text: "COLOCAR O TABLET PRA CARREGAR", categoryId: "general", completed: true, createdAt: 1710000000114 },
  { id: 115, text: "ENCHER OS POTES DE REMÉDIOS PARA VIAGEM", categoryId: "general", completed: true, createdAt: 1710000000115 },
  { id: 116, text: "PASSAR NA PAPELARIA E COMPRAR UMA FITA AMARELA", categoryId: "general", completed: true, createdAt: 1710000000116 },
  { id: 117, text: "IMPRIMIR COMPROVANTE DE RESIDÊNCIA DE CAXIAS", categoryId: "general", completed: true, createdAt: 1710000000117 },
  { id: 118, text: "IMPRIMIR CERTIFICADO DE VACINAÇÃO FEBRE AMARELA", categoryId: "travel", completed: true, createdAt: 1710000000118 },
  { id: 119, text: "ACABAR DE FAZER A LISTA DO QUE TEM NA MALA DE 23KG", categoryId: "general", completed: true, createdAt: 1710000000119 },
  { id: 120, text: "VER O QUE VOU LEVAR NA MALA DE 10KG", categoryId: "travel", completed: true, createdAt: 1710000000120 },
];

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
    return savedTasks ? JSON.parse(savedTasks) : IMAGE_TASKS_DATA;
  });
  
  const [newTaskText, setNewTaskText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [nagMessage, setNagMessage] = useState('SINCRONIZANDO...');
  const [isAdding, setIsAdding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [cloudError, setCloudError] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const progress = useMemo(() => {
    if (tasks.length === 0) return 100;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  // Efeito para lidar com a instalação (PWA)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('André instalou o app! Agora não tem desculpa.');
    }
    setDeferredPrompt(null);
  };

  // Efeito principal de sincronização
  useEffect(() => {
    const andreTasksDoc = doc(db, "users_data", "andre_tasks");
    
    const loadFromCloud = async () => {
      try {
        const docSnap = await getDoc(andreTasksDoc);
        if (docSnap.exists()) {
          const cloudTasks = docSnap.data().tasks || [];
          if (cloudTasks.length > 0) {
            setTasks(cloudTasks);
            localStorage.setItem('foco_tasks_andre', JSON.stringify(cloudTasks));
          } else {
            await syncToCloud(tasks);
          }
        } else {
          await syncToCloud(IMAGE_TASKS_DATA);
          setTasks(IMAGE_TASKS_DATA);
        }
      } catch (err) {
        console.error("Erro ao ler da nuvem:", err);
        setCloudError(true);
      } finally {
        setIsSyncing(false);
      }
    };

    loadFromCloud();

    const unsubscribe = onSnapshot(andreTasksDoc, (docSnap) => {
      if (docSnap.exists()) {
        const cloudTasks = docSnap.data().tasks || [];
        if (JSON.stringify(cloudTasks) !== JSON.stringify(tasks)) {
          setTasks(cloudTasks);
          localStorage.setItem('foco_tasks_andre', JSON.stringify(cloudTasks));
        }
        setCloudError(false);
      }
    }, (error) => {
      console.error("Erro no Listener Firestore:", error);
      setCloudError(true);
    });

    requestNotificationPermission();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => updateNag(), 2000);
    return () => clearTimeout(timer);
  }, [tasks.length, tasks.filter(t => !t.completed).length]);

  const updateNag = async () => {
    try {
      const msg = await getNaggingMessage(tasks.filter(t => !t.completed));
      setNagMessage(msg);
    } catch (e) {
      setNagMessage("VAI TRABALHAR, ANDRÉ!");
    }
  };

  const syncToCloud = async (newTasks: Task[]) => {
    setIsSyncing(true);
    try {
      await setDoc(doc(db, "users_data", "andre_tasks"), { tasks: newTasks }, { merge: true });
      setCloudError(false);
    } catch (e) {
      console.error("Erro ao sincronizar:", e);
      setCloudError(true);
    } finally {
      setIsSyncing(false);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTaskText.trim();
    if (!text || isAdding) return;
    
    setIsAdding(true);
    const tempId = Date.now();
    
    try {
      const autoCategoryId = await getAutoCategory(text);
      
      const newTask: Task = {
        id: tempId,
        text: text,
        categoryId: autoCategoryId,
        completed: false,
        createdAt: Date.now(),
        dueDate: dueDate || undefined,
      };

      const updatedTasks = [newTask, ...tasks];
      setTasks(updatedTasks);
      setNewTaskText('');
      setDueDate('');
      
      localStorage.setItem('foco_tasks_andre', JSON.stringify(updatedTasks));
      await syncToCloud(updatedTasks);

      const insight = await getTaskInsight(newTask);
      if (insight) {
        const withInsight = updatedTasks.map(t => t.id === tempId ? { ...t, insight } : t);
        setTasks(withInsight);
        await syncToCloud(withInsight);
      }
    } catch (e) {
      console.error("Erro ao adicionar", e);
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
    <div className="min-h-screen pb-24 px-3 sm:px-6 pt-12 max-w-2xl mx-auto overflow-x-hidden">
      {/* Banner de Instalação (Somente se disponível) */}
      {deferredPrompt && (
        <div className="fixed top-4 left-4 right-4 z-[100] bg-white text-[#050a18] p-4 rounded-2xl shadow-2xl border-2 border-indigo-500 flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Download size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider">Instalação Obrigatória</p>
              <p className="text-[12px] font-bold">André, coloque o FOCO na sua tela agora!</p>
            </div>
          </div>
          <button 
            onClick={handleInstallClick}
            className="bg-[#050a18] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors"
          >
            Instalar
          </button>
        </div>
      )}

      {/* Header e Progresso */}
      <div className="mb-10 text-center space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
            <Zap size={14} className="text-indigo-400 fill-indigo-400" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Inteligência Vigilante</span>
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/40 rounded-full border border-white/5">
            {isSyncing ? (
              <>
                <Loader2 size={10} className="animate-spin text-indigo-400" />
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Sincronizando...</span>
              </>
            ) : cloudError ? (
              <>
                <CloudOff size={10} className="text-rose-500" />
                <span className="text-[8px] font-bold text-rose-500 uppercase tracking-widest">Erro de Rede</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={10} className="text-emerald-500" />
                <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Nuvem Online</span>
              </>
            )}
          </div>
        </div>
        
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase leading-tight tracking-tighter text-white min-h-[5rem] flex items-center justify-center px-4">
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
            {progress === 100 ? "Nível Mestre: Todas as frentes concluídas." : "O sucesso é a soma de tarefas executadas com rigor."}
          </p>
        </div>
      </div>

      {/* Categorias */}
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

      {/* Input */}
      <form onSubmit={addTask} className="space-y-4 mb-10">
        <div className="relative group">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="PRÓXIMO PASSO DE EXECUÇÃO?"
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

      {/* Lista */}
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
            <p className="text-slate-500 text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-4">Tudo executado. André, você superou as expectativas.</p>
          </div>
        )}
      </div>

      {tasks.some(t => !t.completed) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full flex items-center gap-2 sm:gap-3 shadow-2xl animate-bounce border-2 border-indigo-400 z-50 whitespace-nowrap overflow-hidden max-w-[90vw]">
          <Bell size={14} fill="white" className="shrink-0" />
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter truncate">ANDRÉ, PARE DE ENROLAR!</span>
        </div>
      )}
    </div>
  );
}
