
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Kanban, 
  Settings, 
  Bell, 
  Plus, 
  Search, 
  MessageSquare, 
  Clock, 
  User as UserIcon,
  ChevronRight,
  Sparkles,
  MoreVertical,
  LogOut,
  X,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { 
  Project, 
  Task, 
  User, 
  TaskStatus, 
  Priority, 
  Notification, 
  Comment 
} from './types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_TASKS, 
  CURRENT_USER, 
  TEAM_MEMBERS 
} from './constants';
import { generateTaskSuggestions, getAIAssistantResponse } from './geminiService';

// --- Sub-Components ---

const Avatar: React.FC<{ src?: string; name: string; size?: 'sm' | 'md' | 'lg' }> = ({ src, name, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base'
  };
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border border-white shadow-sm shrink-0`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-semibold text-indigo-600 uppercase">{name.charAt(0)}</span>
      )}
    </div>
  );
};

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const colors = {
    [Priority.LOW]: 'bg-slate-100 text-slate-700',
    [Priority.MEDIUM]: 'bg-blue-100 text-blue-700',
    [Priority.HIGH]: 'bg-orange-100 text-orange-700',
    [Priority.URGENT]: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[priority]}`}>
      {priority}
    </span>
  );
};

// --- Main App ---

export default function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'board' | 'settings'>('dashboard');
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(INITIAL_PROJECTS[0].id);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState<Task | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // AI Assistant State
  const [aiMessage, setAiMessage] = useState('');
  const [aiHistory, setAiHistory] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Derived data
  const currentProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]
  );

  const filteredTasks = useMemo(() => {
    let list = tasks.filter(t => t.projectId === selectedProjectId);
    if (searchQuery) {
      list = list.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return list;
  }, [tasks, selectedProjectId, searchQuery]);

  // Simulated Real-time Notification
  const addNotification = (title: string, message: string, type: Notification['type'] = 'info') => {
    const newNote: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false
    };
    setNotifications(prev => [newNote, ...prev]);
  };

  // Actions
  const handleAddTask = (taskData: Partial<Task>) => {
    if (!selectedProjectId) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId: selectedProjectId,
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      status: taskData.status || TaskStatus.TODO,
      priority: taskData.priority || Priority.MEDIUM,
      assigneeId: taskData.assigneeId,
      creatorId: CURRENT_USER.id,
      createdAt: Date.now(),
      comments: [],
      labels: [],
      ...taskData
    };
    setTasks(prev => [...prev, newTask]);
    setShowNewTaskModal(false);
    addNotification('Task Created', `"${newTask.title}" has been added.`, 'success');
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    addNotification('Status Updated', 'Task moved to ' + newStatus, 'info');
  };

  const handleAddComment = (taskId: string, text: string) => {
    if (!text.trim()) return;
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      userId: CURRENT_USER.id,
      userName: CURRENT_USER.name,
      text,
      timestamp: Date.now()
    };
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, comments: [...t.comments, newComment] } : t));
  };

  const handleAskAI = async () => {
    if (!aiMessage.trim()) return;
    const userMsg = aiMessage;
    setAiHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setAiMessage('');
    setIsAiLoading(true);

    const context = `Project: ${currentProject?.name}. Tasks: ${filteredTasks.map(t => t.title).join(', ')}.`;
    const response = await getAIAssistantResponse(userMsg, context);
    
    setAiHistory(prev => [...prev, { role: 'bot', text: response }]);
    setIsAiLoading(false);
  };

  const createProject = (name: string, desc: string) => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name,
      description: desc,
      ownerId: CURRENT_USER.id,
      members: [CURRENT_USER.id],
      createdAt: Date.now()
    };
    setProjects(prev => [...prev, newProj]);
    setSelectedProjectId(newProj.id);
    setShowNewProjectModal(false);
    addNotification('Project Created', `Welcome to ${name}!`, 'success');
  };

  // --- Views ---

  const Dashboard = () => {
    const stats = [
      { name: 'Todo', count: tasks.filter(t => t.status === TaskStatus.TODO).length, fill: '#6366f1' },
      { name: 'In Progress', count: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, fill: '#3b82f6' },
      { name: 'Review', count: tasks.filter(t => t.status === TaskStatus.REVIEW).length, fill: '#f59e0b' },
      { name: 'Done', count: tasks.filter(t => t.status === TaskStatus.DONE).length, fill: '#10b981' },
    ];

    const priorityData = [
      { name: 'Low', value: tasks.filter(t => t.priority === Priority.LOW).length },
      { name: 'Medium', value: tasks.filter(t => t.priority === Priority.MEDIUM).length },
      { name: 'High', value: tasks.filter(t => t.priority === Priority.HIGH).length },
      { name: 'Urgent', value: tasks.filter(t => t.priority === Priority.URGENT).length },
    ];

    const COLORS = ['#94a3b8', '#3b82f6', '#f97316', '#ef4444'];

    return (
      <div className="space-y-8 animate-in fade-in duration-500 p-2 md:p-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Welcome back, {CURRENT_USER.name}</h2>
            <p className="text-slate-500 mt-1">Here's what's happening across your projects today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowNewProjectModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-lg shadow-indigo-200">
              <Plus size={18} /> New Project
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(s => (
            <div key={s.name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{s.name}</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{s.count}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: `${s.fill}15` }}>
                <CheckCircle2 size={24} style={{ color: s.fill }} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <LayoutDashboard size={18} className="text-indigo-600" />
              Task Distribution by Status
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <AlertCircle size={18} className="text-orange-500" />
              Priority Breakdown
            </h3>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 ml-4">
                {priorityData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-sm text-slate-600">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Your Projects</h3>
            <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1">
              View All <ChevronRight size={16} />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {projects.map(p => (
              <div 
                key={p.id} 
                className="p-4 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between"
                onClick={() => { setSelectedProjectId(p.id); setActiveView('board'); }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">{p.name}</h4>
                    <p className="text-sm text-slate-500 line-clamp-1 max-w-md">{p.description}</p>
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {p.members.slice(0, 3).map(mid => {
                    const member = TEAM_MEMBERS.find(m => m.id === mid);
                    return <Avatar key={mid} name={member?.name || '?'} src={member?.avatar} size="sm" />;
                  })}
                  {p.members.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] border border-white">
                      +{p.members.length - 3}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const Board = () => {
    const columns = [
      { id: TaskStatus.TODO, title: 'To Do', color: 'bg-slate-500' },
      { id: TaskStatus.IN_PROGRESS, title: 'In Progress', color: 'bg-blue-500' },
      { id: TaskStatus.REVIEW, title: 'Review', color: 'bg-orange-500' },
      { id: TaskStatus.DONE, title: 'Completed', color: 'bg-emerald-500' },
    ];

    if (!currentProject) return null;

    return (
      <div className="h-full flex flex-col p-2 md:p-6 animate-in slide-in-from-right duration-500">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <span>Projects</span> <ChevronRight size={14} /> <span>{currentProject.name}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{currentProject.name} Board</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowNewTaskModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition"
            >
              <Plus size={20} />
            </button>
            <button 
              onClick={() => setShowAIModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition"
              title="AI Copilot"
            >
              <Sparkles size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 h-full min-w-[1000px]">
            {columns.map(col => (
              <div key={col.id} className="w-80 flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.color}`}></span>
                    <h3 className="font-semibold text-slate-700 uppercase tracking-wider text-sm">{col.title}</h3>
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
                      {filteredTasks.filter(t => t.status === col.id).length}
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600"><Plus size={16} /></button>
                </div>

                <div className="flex-1 space-y-4 kanban-column">
                  {filteredTasks
                    .filter(t => t.status === col.id)
                    .map(task => (
                      <div 
                        key={task.id} 
                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition cursor-pointer group"
                        onClick={() => setShowTaskDetail(task)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <PriorityBadge priority={task.priority} />
                          <button className="text-slate-300 opacity-0 group-hover:opacity-100 transition"><MoreVertical size={14} /></button>
                        </div>
                        <h4 className="font-semibold text-slate-800 mb-2 leading-snug">{task.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4">{task.description}</p>
                        
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                          <div className="flex items-center gap-3 text-slate-400">
                            {task.comments.length > 0 && (
                              <div className="flex items-center gap-1">
                                <MessageSquare size={12} />
                                <span className="text-[10px] font-medium">{task.comments.length}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              <span className="text-[10px] font-medium">
                                {new Date(task.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                          {task.assigneeId && (
                            <Avatar 
                              src={TEAM_MEMBERS.find(m => m.id === task.assigneeId)?.avatar} 
                              name={TEAM_MEMBERS.find(m => m.id === task.assigneeId)?.name || '?'} 
                              size="sm" 
                            />
                          )}
                        </div>
                      </div>
                    ))
                  }
                  {filteredTasks.filter(t => t.status === col.id).length === 0 && (
                    <div className="h-24 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm italic">
                      No tasks yet
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // --- Modals ---

  const TaskDetailModal = () => {
    const [commentText, setCommentText] = useState('');
    if (!showTaskDetail) return null;

    const t = showTaskDetail;
    const assignee = TEAM_MEMBERS.find(m => m.id === t.assigneeId);

    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <PriorityBadge priority={t.priority} />
              <span className="text-slate-400 text-sm">#{t.id.split('-').pop()}</span>
            </div>
            <button onClick={() => setShowTaskDetail(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.title}</h2>
              <p className="text-slate-600 leading-relaxed">{t.description}</p>
            </section>

            <div className="grid grid-cols-2 gap-8 py-6 border-y border-slate-50">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Assignee</p>
                <div className="flex items-center gap-3">
                  <Avatar src={assignee?.avatar} name={assignee?.name || 'Unassigned'} size="md" />
                  <span className="font-medium text-slate-700">{assignee?.name || 'Unassigned'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Status</p>
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={t.status}
                  onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value as TaskStatus)}
                >
                  {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
                </select>
              </div>
            </div>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <MessageSquare size={18} className="text-indigo-500" /> Comments
              </h3>
              <div className="space-y-6">
                {t.comments.map(c => (
                  <div key={c.id} className="flex gap-4">
                    <Avatar name={c.userName} src={TEAM_MEMBERS.find(m => m.id === c.userId)?.avatar} size="sm" />
                    <div className="flex-1 bg-slate-50 p-4 rounded-xl rounded-tl-none">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-800">{c.userName}</span>
                        <span className="text-[10px] text-slate-400">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm text-slate-700">{c.text}</p>
                    </div>
                  </div>
                ))}
                {t.comments.length === 0 && (
                  <p className="text-center text-slate-400 py-4 italic">No comments yet. Start the conversation!</p>
                )}
              </div>
            </section>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
            <Avatar src={CURRENT_USER.avatar} name={CURRENT_USER.name} size="sm" />
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Write a comment..." 
                className="w-full bg-white border border-slate-200 rounded-full pl-4 pr-12 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddComment(t.id, commentText);
                    setCommentText('');
                  }
                }}
              />
              <button 
                onClick={() => { handleAddComment(t.id, commentText); setCommentText(''); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 hover:text-indigo-700"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AIAssistantModal = () => {
    if (!showAIModal) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col h-[600px] animate-in slide-in-from-bottom duration-300 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Sparkles size={24} />
              </div>
              <div>
                <h2 className="font-bold text-xl">ZenFlow AI Assistant</h2>
                <p className="text-xs text-white/80">Intelligent project insights</p>
              </div>
            </div>
            <button onClick={() => setShowAIModal(false)} className="hover:bg-white/10 p-2 rounded-lg transition"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
            {aiHistory.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100">
                  <Sparkles size={32} className="text-purple-500 animate-pulse" />
                </div>
                <div className="max-w-xs">
                  <h3 className="font-bold text-slate-800">How can I help you today?</h3>
                  <p className="text-sm text-slate-500 mt-2">I can suggest tasks, summarize progress, or help plan your next move.</p>
                </div>
              </div>
            )}
            {aiHistory.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm rounded-tl-none flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-white border-t border-slate-100">
            <div className="flex items-center gap-3">
              <input 
                type="text" 
                placeholder="Ask me anything about your project..." 
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                disabled={isAiLoading}
              />
              <button 
                onClick={handleAskAI}
                disabled={isAiLoading || !aiMessage.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-3 rounded-xl shadow-lg transition"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const NewTaskModal = () => {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [priority, setPriority] = useState(Priority.MEDIUM);
    const [assignee, setAssignee] = useState(TEAM_MEMBERS[0].id);

    if (!showNewTaskModal) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Create New Task</h2>
            <button onClick={() => setShowNewTaskModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase mb-2">Title</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="What needs to be done?"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase mb-2">Description</label>
              <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
                placeholder="Add more details..."
                value={desc}
                onChange={e => setDesc(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-500 uppercase mb-2">Priority</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={priority}
                  onChange={e => setPriority(e.target.value as Priority)}
                >
                  {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-500 uppercase mb-2">Assignee</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={assignee}
                  onChange={e => setAssignee(e.target.value)}
                >
                  {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
            
            <button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-100 transition mt-4"
              onClick={() => handleAddTask({ title, description: desc, priority, assigneeId: assignee })}
            >
              Create Task
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <LayoutDashboard size={24} />
          </div>
          <h1 className="hidden md:block text-xl font-bold text-slate-800 tracking-tight">ZenFlow</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 py-4">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeView === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
          >
            <LayoutDashboard size={20} />
            <span className="hidden md:block">Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveView('board')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeView === 'board' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
          >
            <Kanban size={20} />
            <span className="hidden md:block">Project Board</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-500 hover:bg-slate-50 transition">
            <Settings size={20} />
            <span className="hidden md:block">Settings</span>
          </button>

          <div className="pt-8 pb-4">
            <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 mb-4">Your Projects</p>
            <div className="space-y-1">
              {projects.map(p => (
                <button 
                  key={p.id}
                  onClick={() => { setSelectedProjectId(p.id); setActiveView('board'); }}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition ${selectedProjectId === p.id ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${selectedProjectId === p.id ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  <span className="hidden md:block truncate">{p.name}</span>
                </button>
              ))}
              <button 
                onClick={() => setShowNewProjectModal(true)}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-indigo-600 hover:bg-indigo-50 transition"
              >
                <Plus size={16} />
                <span className="hidden md:block font-medium">Add Project</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 transition">
            <LogOut size={20} />
            <span className="hidden md:block">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 text-slate-400 md:hidden">
            <LayoutDashboard size={24} className="text-indigo-600" />
          </div>
          <div className="hidden md:flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
            <Clock size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-500">Working: ZenFlow Desktop Redesign</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer">
              <div className="p-2 rounded-full hover:bg-slate-100 transition relative">
                <Bell size={20} className="text-slate-600" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              {/* Simple dropdown for notifications */}
              <div className="absolute right-0 top-full mt-2 w-80 bg-white shadow-2xl rounded-2xl border border-slate-100 p-2 z-[100] hidden group-hover:block animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-slate-50 flex items-center justify-between">
                  <h4 className="font-bold text-slate-800">Notifications</h4>
                  <button onClick={() => setNotifications([])} className="text-xs text-indigo-600 font-medium">Clear All</button>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-8 text-center text-sm text-slate-400">No new notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-3 hover:bg-slate-50 rounded-lg transition cursor-default">
                        <p className="font-bold text-xs text-slate-800">{n.title}</p>
                        <p className="text-xs text-slate-500">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(n.timestamp).toLocaleTimeString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{CURRENT_USER.name}</p>
                <p className="text-xs text-slate-500">Lead Designer</p>
              </div>
              <Avatar name={CURRENT_USER.name} src={CURRENT_USER.avatar} size="md" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {activeView === 'dashboard' ? <Dashboard /> : <Board />}
        </div>
      </main>

      {/* Modals and Overlays */}
      <NewTaskModal />
      <TaskDetailModal />
      <AIAssistantModal />
      
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Start New Project</h2>
              <button onClick={() => setShowNewProjectModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-500 uppercase mb-2">Project Name</label>
                <input 
                  id="p-name"
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Marketing Q4"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-500 uppercase mb-2">Description</label>
                <textarea 
                  id="p-desc"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                  placeholder="What is this project about?"
                />
              </div>
              <button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg transition"
                onClick={() => {
                  const n = (document.getElementById('p-name') as HTMLInputElement).value;
                  const d = (document.getElementById('p-desc') as HTMLTextAreaElement).value;
                  createProject(n, d);
                }}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
