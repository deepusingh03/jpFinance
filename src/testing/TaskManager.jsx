import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, PlayCircle, CheckCircle, GripVertical, Sparkles } from 'lucide-react';

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [newTaskInputs, setNewTaskInputs] = useState({
    new: '',
    pending: '',
    working: '',
    done: ''
  });
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedOver, setDraggedOver] = useState(null);
  const [confetti, setConfetti] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('taskFlowTasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('taskFlowTasks', JSON.stringify(tasks));
  }, [tasks]);

  const createConfetti = () => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];
    const pieces = [];
    
    for (let i = 0; i < 50; i++) {
      pieces.push({
        id: Math.random(),
        left: Math.random() * 100,
        animationDelay: Math.random() * 0.5,
        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    
    setConfetti(pieces);
    setShowCelebration(true);
    
    setTimeout(() => {
      setShowCelebration(false);
      setConfetti([]);
    }, 3000);
  };

  const addTask = (status, e) => {
    e.preventDefault();
    const taskText = newTaskInputs[status].trim();
    
    if (!taskText) return;
    
    const newTask = {
      id: Date.now(),
      title: taskText,
      status: status,
      createdAt: Date.now()
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskInputs({ ...newTaskInputs, [status]: '' });
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOver(columnId);
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    
    if (draggedTask && draggedTask.status !== newStatus) {
      setTasks(tasks.map(task => 
        task.id === draggedTask.id ? { ...task, status: newStatus } : task
      ));
      
      // Trigger confetti if dropped in 'done' column
      if (newStatus === 'done') {
        createConfetti();
      }
    }
    
    setDraggedTask(null);
    setDraggedOver(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDraggedOver(null);
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const columns = [
    {
      id: 'new',
      title: 'New',
      icon: Plus,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      dragBorderColor: 'border-blue-500',
      textColor: 'text-blue-400',
      hoverColor: 'hover:bg-blue-500/20'
    },
    {
      id: 'pending',
      title: 'Pending',
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      dragBorderColor: 'border-amber-500',
      textColor: 'text-amber-400',
      hoverColor: 'hover:bg-amber-500/20'
    },
    {
      id: 'working',
      title: 'Working',
      icon: PlayCircle,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      dragBorderColor: 'border-purple-500',
      textColor: 'text-purple-400',
      hoverColor: 'hover:bg-purple-500/20'
    },
    {
      id: 'done',
      title: 'Done',
      icon: CheckCircle,
      color: 'from-emerald-500 to-green-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      dragBorderColor: 'border-emerald-500',
      textColor: 'text-emerald-400',
      hoverColor: 'hover:bg-emerald-500/20'
    }
  ];

  const handleInputChange = (status, value) => {
    setNewTaskInputs({ ...newTaskInputs, [status]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      {/* Confetti */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {confetti.map((piece) => (
            <div
              key={piece.id}
              className="confetti"
              style={{
                left: `${piece.left}%`,
                backgroundColor: piece.backgroundColor,
                animationDelay: `${piece.animationDelay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Celebration Message */}
      {showCelebration && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-celebration">
          <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-8 py-6 rounded-2xl shadow-2xl flex items-center gap-4">
            <Sparkles className="w-8 h-8 animate-spin" />
            <div>
              <h2 className="text-3xl font-bold">Great Job! 🎉</h2>
              <p className="text-emerald-100">Task completed successfully!</p>
            </div>
            <Sparkles className="w-8 h-8 animate-spin" style={{ animationDirection: 'reverse' }} />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-[1800px] mx-auto mb-8 relative z-10">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-center">
          Task Flow Board
        </h1>
        <p className="text-slate-400 text-center text-lg">Drag tasks between columns to update status</p>
      </div>

      {/* Kanban Board */}
      <div className="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {columns.map((column, columnIndex) => {
          const Icon = column.icon;
          const columnTasks = getTasksByStatus(column.id);
          const isDropTarget = draggedOver === column.id;
          
          return (
            <div
              key={column.id}
              className="flex flex-col h-[calc(100vh-200px)] animate-slide-in"
              style={{ animationDelay: `${columnIndex * 100}ms` }}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className={`bg-gradient-to-r ${column.color} p-4 rounded-t-2xl shadow-lg transition-all duration-300 ${
                isDropTarget ? 'ring-4 ring-white/50 scale-105 shadow-2xl' : ''
              }`}>
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${isDropTarget ? 'animate-bounce' : ''}`} />
                    <h2 className="text-xl font-bold">{column.title}</h2>
                  </div>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              {/* Add Task Form */}
              <div className={`${column.bgColor} border-x-2 ${isDropTarget ? column.dragBorderColor : column.borderColor} p-3 transition-all duration-300`}>
                <form onSubmit={(e) => addTask(column.id, e)} className="relative">
                  <input
                    type="text"
                    value={newTaskInputs[column.id]}
                    onChange={(e) => handleInputChange(column.id, e.target.value)}
                    placeholder="Add new task..."
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-all text-sm"
                  />
                  <button
                    type="submit"
                    className={`absolute right-2 top-1/2 -translate-y-1/2 ${column.textColor} ${column.hoverColor} p-2 rounded-lg transition-all hover:scale-110`}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </form>
              </div>

              {/* Tasks List */}
              <div className={`flex-1 overflow-y-auto ${column.bgColor} border-x-2 border-b-2 ${
                isDropTarget ? column.dragBorderColor + ' shadow-lg shadow-' + column.textColor.replace('text-', '') + '/20' : column.borderColor
              } rounded-b-2xl p-3 space-y-3 custom-scrollbar transition-all duration-300 ${
                isDropTarget ? 'scale-[1.02]' : ''
              }`}>
                {columnTasks.length === 0 ? (
                  <div className="text-center py-12 text-slate-600">
                    <Icon className={`w-12 h-12 mx-auto mb-3 opacity-30 ${isDropTarget ? 'animate-bounce' : ''}`} />
                    <p className="text-sm">No tasks yet</p>
                    {isDropTarget && (
                      <p className={`text-sm mt-2 ${column.textColor} animate-pulse font-semibold`}>Drop here! 👇</p>
                    )}
                  </div>
                ) : (
                  columnTasks.map((task, index) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      className={`group bg-slate-800/80 backdrop-blur-sm border-2 ${
                        draggedTask?.id === task.id 
                          ? column.dragBorderColor + ' shadow-lg' 
                          : 'border-slate-700/50'
                      } rounded-xl p-4 hover:bg-slate-800 hover:border-slate-600 transition-all duration-300 hover:shadow-lg animate-fade-in cursor-move ${
                        draggedTask?.id === task.id ? 'opacity-50 scale-95 rotate-2' : ''
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Task Content */}
                      <div className="flex items-start gap-3">
                        {/* Drag Handle */}
                        <div className={`flex-shrink-0 mt-0.5 ${draggedTask?.id === task.id ? column.textColor : 'text-slate-600'}`}>
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Task Title */}
                        <p className="text-slate-200 text-sm flex-1 leading-relaxed">
                          {task.title}
                        </p>

                        {/* Delete Button */}
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="flex-shrink-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition-all hover:scale-110"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-20px) scale(1.1);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-30px) scale(1.05);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes celebration {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }

        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          top: -10px;
          animation: confetti-fall 3s linear forwards;
        }

        .animate-celebration {
          animation: celebration 0.5s ease-out forwards;
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 10s ease-in-out infinite;
        }

        .animate-slide-in {
          animation: slide-in 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
          opacity: 0;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.7);
        }
      `}</style>
    </div>
  );
};

export default TaskManager;