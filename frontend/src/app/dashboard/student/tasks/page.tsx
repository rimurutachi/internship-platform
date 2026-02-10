"use client";

import { useState, useEffect, useCallback } from 'react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Plus, 
  MoreVertical, 
  Calendar, 
  CheckCircle2,
  Circle,
  PlayCircle,
  Trash2,
  Pencil,
  AlertCircle,
  ListTodo,
} from 'lucide-react';
import { studentAPI } from '@/lib/api/student';
import type { StudentTask, TaskStats, TaskStatus, TaskPriority } from '@/types/student';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { toast } from 'sonner';

// Priority color mappings
const priorityDotColors: Record<TaskPriority, string> = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
};

// Status icon mappings
const StatusIcon = ({ status }: { status: TaskStatus }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-6 h-6 text-green-500" />;
    case 'in_progress':
      return <PlayCircle className="w-6 h-6 text-blue-500" />;
    default:
      return <Circle className="w-6 h-6 text-gray-400" />;
  }
};

// Format due date with smart labels
const formatDueDate = (dueDate: string | null | undefined) => {
  if (!dueDate) return null;
  
  const date = new Date(dueDate);
  
  if (isToday(date)) {
    return { text: 'Today', isOverdue: false, className: 'text-orange-600' };
  }
  if (isTomorrow(date)) {
    return { text: 'Tomorrow', isOverdue: false, className: 'text-blue-600' };
  }
  if (isPast(date)) {
    return { text: format(date, 'MMM d'), isOverdue: true, className: 'text-red-600' };
  }
  return { text: format(date, 'MMM d'), isOverdue: false, className: 'text-gray-600' };
};

// Task form component (moved outside to prevent re-creation and input loss)
const TaskForm = ({
  formTitle,
  setFormTitle,
  formDescription,
  setFormDescription,
  formPriority,
  setFormPriority,
  formDueDate,
  setFormDueDate,
}: {
  formTitle: string;
  setFormTitle: (v: string) => void;
  formDescription: string;
  setFormDescription: (v: string) => void;
  formPriority: TaskPriority;
  setFormPriority: (v: TaskPriority) => void;
  formDueDate: string;
  setFormDueDate: (v: string) => void;
}) => (
  <div className="space-y-5">
    <div className="space-y-2">
      <label className="text-base font-semibold text-gray-700">Title *</label>
      <Input
        placeholder="What needs to be done?"
        value={formTitle}
        onChange={(e) => setFormTitle(e.target.value)}
        maxLength={200}
        className="text-base h-11"
      />
    </div>

    <div className="space-y-2">
      <label className="text-base font-semibold text-gray-700">Description</label>
      <Textarea
        placeholder="Add more details..."
        value={formDescription}
        onChange={(e) => setFormDescription(e.target.value)}
        rows={4}
        className="text-base"
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-base font-semibold text-gray-700">Priority</label>
        <Select value={formPriority} onValueChange={(v) => setFormPriority(v as TaskPriority)}>
          <SelectTrigger className="h-11 text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-base">Low</span>
              </div>
            </SelectItem>
            <SelectItem value="medium">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="text-base">Medium</span>
              </div>
            </SelectItem>
            <SelectItem value="high">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-base">High</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-base font-semibold text-gray-700">Due Date</label>
        <Input
          type="date"
          value={formDueDate}
          onChange={(e) => setFormDueDate(e.target.value)}
          className="h-11 text-base"
        />
      </div>
    </div>
  </div>
);

export default function TaskListsPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [stats, setStats] = useState<TaskStats>({ total: 0, pending: 0, in_progress: 0, completed: 0 });
  const [activeFilter, setActiveFilter] = useState<TaskStatus | 'all'>('all');
  const [internshipId, setInternshipId] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<StudentTask | null>(null);
  
  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('medium');
  const [formDueDate, setFormDueDate] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Fetch internship ID first
  useEffect(() => {
    const fetchInternship = async () => {
      try {
        const response = await studentAPI.getDashboard();
        if (response.success && response.data?.internship?.id) {
          setInternshipId(response.data.internship.id);
        }
      } catch (error) {
        console.error('Failed to fetch internship:', error);
      }
    };
    fetchInternship();
  }, []);

  // Load tasks
  const loadTasks = useCallback(async () => {
    if (!internshipId) return;
    
    try {
      setLoading(true);
      console.log('🔵 [Tasks] Loading tasks...', { filter: activeFilter, internshipId });
      
      const response = await studentAPI.getTasks({
        status: activeFilter,
        internship_id: internshipId,
      });
      
      if (response.success && response.data) {
        setTasks(response.data.tasks || []);
        setStats(response.data.stats || { total: 0, pending: 0, in_progress: 0, completed: 0 });
        console.log('✅ [Tasks] Loaded:', response.data.tasks?.length || 0, 'tasks');
      } else {
        console.error('❌ [Tasks] Load failed:', response.error);
        toast.error('Failed to load tasks');
      }
    } catch (error: unknown) {
      console.error('💥 [Tasks] Load exception:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [internshipId, activeFilter]);

  useEffect(() => {
    if (internshipId) {
      loadTasks();
    }
  }, [internshipId, loadTasks]);

  // Reset form
  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormPriority('medium');
    setFormDueDate('');
  };

  // Create task
  const handleCreateTask = async () => {
    if (!internshipId || !formTitle.trim()) return;
    
    try {
      setFormSubmitting(true);
      console.log('🔵 [Tasks] Creating task:', formTitle);
      
      const response = await studentAPI.createTask({
        internship_id: internshipId,
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        priority: formPriority,
        due_date: formDueDate || undefined,
      });
      
      if (response.success) {
        toast.success('Task created successfully');
        setCreateDialogOpen(false);
        resetForm();
        loadTasks();
      } else {
        toast.error(response.error || 'Failed to create task');
      }
    } catch (error: unknown) {
      console.error('💥 [Tasks] Create exception:', error);
      toast.error('Failed to create task');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Update task
  const handleUpdateTask = async () => {
    if (!selectedTask || !formTitle.trim()) return;
    
    try {
      setFormSubmitting(true);
      console.log('🔵 [Tasks] Updating task:', selectedTask.id);
      
      const response = await studentAPI.updateTask(selectedTask.id, {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        priority: formPriority,
        due_date: formDueDate || null,
      });
      
      if (response.success) {
        toast.success('Task updated successfully');
        setEditDialogOpen(false);
        setSelectedTask(null);
        resetForm();
        loadTasks();
      } else {
        toast.error(response.error || 'Failed to update task');
      }
    } catch (error: unknown) {
      console.error('💥 [Tasks] Update exception:', error);
      toast.error('Failed to update task');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Quick status update
  const handleStatusChange = async (task: StudentTask, newStatus: TaskStatus) => {
    try {
      console.log('🔵 [Tasks] Status change:', task.id, '->', newStatus);
      
      const response = await studentAPI.updateTask(task.id, { status: newStatus });
      
      if (response.success) {
        toast.success(newStatus === 'completed' ? 'Task completed! 🎉' : 'Task status updated');
        loadTasks();
      } else {
        toast.error(response.error || 'Failed to update status');
      }
    } catch (error: unknown) {
      console.error('💥 [Tasks] Status change exception:', error);
      toast.error('Failed to update status');
    }
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    
    try {
      setFormSubmitting(true);
      console.log('🔵 [Tasks] Deleting task:', selectedTask.id);
      
      const response = await studentAPI.deleteTask(selectedTask.id);
      
      if (response.success) {
        toast.success('Task deleted');
        setDeleteDialogOpen(false);
        setSelectedTask(null);
        loadTasks();
      } else {
        toast.error(response.error || 'Failed to delete task');
      }
    } catch (error: unknown) {
      console.error('💥 [Tasks] Delete exception:', error);
      toast.error('Failed to delete task');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (task: StudentTask) => {
    setSelectedTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormPriority(task.priority);
    setFormDueDate(task.due_date ? task.due_date.split('T')[0] : '');
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (task: StudentTask) => {
    setSelectedTask(task);
    setDeleteDialogOpen(true);
  };

  // Task item component
  const TaskItem = ({ task }: { task: StudentTask }) => {
    const dueInfo = formatDueDate(task.due_date);
    const isCompleted = task.status === 'completed';
    
    return (
      <div className={`group flex items-start gap-4 p-5 bg-white rounded-lg border transition-all hover:shadow-md ${isCompleted ? 'opacity-60' : ''}`}>
        {/* Status checkbox */}
        <button
          onClick={() => handleStatusChange(task, isCompleted ? 'pending' : 'completed')}
          className="mt-1 flex-shrink-0"
        >
          <StatusIcon status={task.status} />
        </button>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className={`font-semibold text-lg text-gray-900 ${isCompleted ? 'line-through' : ''}`}>
                {task.title}
              </h3>
              {task.description && (
                <p className="text-base text-gray-600 mt-2 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
            
            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-base">
                {task.status !== 'in_progress' && (
                  <DropdownMenuItem onClick={() => handleStatusChange(task, 'in_progress')}>
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Mark as In Progress
                  </DropdownMenuItem>
                )}
                {task.status !== 'pending' && task.status !== 'completed' && (
                  <DropdownMenuItem onClick={() => handleStatusChange(task, 'pending')}>
                    <Circle className="mr-2 h-5 w-5" />
                    Mark as Pending
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openEditDialog(task)}>
                  <Pencil className="mr-2 h-5 w-5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => openDeleteDialog(task)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-5 w-5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 mt-3">
            {/* Priority badge */}
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${priorityDotColors[task.priority]}`} />
              <span className="text-base text-gray-600 capitalize font-medium">{task.priority}</span>
            </div>

            {/* Due date */}
            {dueInfo && (
              <div className={`flex items-center gap-1.5 text-base font-medium ${dueInfo.className}`}>
                <Calendar className="h-5 w-5" />
                <span>{dueInfo.text}</span>
                {dueInfo.isOverdue && <AlertCircle className="h-4 w-4" />}
              </div>
            )}

            {/* Status badge for in-progress */}
            {task.status === 'in_progress' && (
              <Badge variant="outline" className="text-base px-3 py-1 bg-blue-50 text-blue-600 border-blue-200 font-medium">
                In Progress
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Stats bar component
  const StatsBar = () => (
    <div className="grid grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-xl p-5 border shadow-sm text-center">
        <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        <div className="text-sm text-gray-500 mt-1 font-medium">Total</div>
      </div>
      <div className="bg-white rounded-xl p-5 border shadow-sm text-center">
        <div className="text-3xl font-bold text-gray-900">{stats.pending}</div>
        <div className="text-sm text-gray-500 mt-1 font-medium">Pending</div>
      </div>
      <div className="bg-white rounded-xl p-5 border shadow-sm text-center">
        <div className="text-3xl font-bold text-blue-600">{stats.in_progress}</div>
        <div className="text-sm text-gray-500 mt-1 font-medium">In Progress</div>
      </div>
      <div className="bg-white rounded-xl p-5 border shadow-sm text-center">
        <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
        <div className="text-sm text-gray-500 mt-1 font-medium">Completed</div>
      </div>
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
        <ListTodo className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks yet</h3>
      <p className="text-base text-gray-500 mb-6">
        {activeFilter === 'all' 
          ? "Create your first task to get started"
          : `No ${activeFilter.replace('_', ' ')} tasks`}
      </p>
      {activeFilter === 'all' && (
        <Button onClick={() => setCreateDialogOpen(true)} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Create Task
        </Button>
      )}
    </div>
  );

  // Main content
  const TasksContent = () => (
    <>
      {/* Header with add button */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Task Lists</h1>
        <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="text-base">
          <Plus className="mr-2 h-5 w-5" />
          Add Task
        </Button>
      </div>

      {/* Stats */}
      <StatsBar />

      {/* Filter tabs */}
      <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as TaskStatus | 'all')} className="mb-8">
        <TabsList className="grid w-full grid-cols-4 h-12 text-base">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Task list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </>
  );

  // Desktop layout
  const Desktop = () => (
    <div className="hidden lg:flex h-full">
      <StudentSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <StudentHeader />
        <div className="flex-1 overflow-y-auto p-8 xl:p-12 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <TasksContent />
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile layout
  const Mobile = () => (
    <div className="lg:hidden h-screen flex flex-col overflow-hidden">
      <MobileHeader title="Task Lists" />
      <div className="flex-1 overflow-y-auto p-4 pb-20 bg-gray-50">
        <TasksContent />
      </div>
      <BottomNavigation type="student" />
    </div>
  );

  return (
    <div className="h-screen bg-background overflow-hidden">
      <Desktop />
      <Mobile />

      {/* Create Task Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Task</DialogTitle>
            <DialogDescription className="text-base">
              Add a new task to your list. Set a priority and due date to stay organized.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            formTitle={formTitle}
            setFormTitle={setFormTitle}
            formDescription={formDescription}
            setFormDescription={setFormDescription}
            formPriority={formPriority}
            setFormPriority={setFormPriority}
            formDueDate={formDueDate}
            setFormDueDate={setFormDueDate}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="text-base">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTask} 
              disabled={formSubmitting || !formTitle.trim()}
              className="text-base"
            >
              {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Task</DialogTitle>
            <DialogDescription className="text-base">
              Update your task details.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            formTitle={formTitle}
            setFormTitle={setFormTitle}
            formDescription={formDescription}
            setFormDescription={setFormDescription}
            formPriority={formPriority}
            setFormPriority={setFormPriority}
            formDueDate={formDueDate}
            setFormDueDate={setFormDueDate}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="text-base">
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTask} 
              disabled={formSubmitting || !formTitle.trim()}
              className="text-base"
            >
              {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Delete Task</DialogTitle>
            <DialogDescription className="text-base">
              Are you sure you want to delete &quot;{selectedTask?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="text-base">
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteTask} 
              disabled={formSubmitting}
              className="text-base"
            >
              {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
