import React, { useState, useEffect } from 'react';
import type { Task, CreateTaskRequest } from '../types/Task';
import {
  formatScheduledDate,
  formatScheduledTime,
  getTimeZoneOptions,
  getUserTimeZone,
  utcIsoToLocalParts,
} from '../lib/timezoneUtils';
import { taskService } from '../services/taskService';
import TaskDetailsModal from './TaskDetailsModal';
import { Calendar, Clock, MapPin, Users, Plus, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const sortTasksByDateTime = (tasks: Task[]): Task[] =>
  [...tasks].sort((a, b) => new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime());

interface TaskListProps {
  teamId: string;
  userRole: string;
  teamName: string;
  currentUserId: string;
}

const TaskList: React.FC<TaskListProps> = ({ teamId, userRole, teamName, currentUserId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [viewerTimeZone] = useState(() => getUserTimeZone());
  const timeZoneOptions = getTimeZoneOptions();

  const [formData, setFormData] = useState<CreateTaskRequest>({
    teamId: teamId,
    name: '',
    location: '',
    description: '',
    date: '',
    startTime: '',
    timeZone: getUserTimeZone(),
    maxSignups: 10,
    minSignups: 1,
    createdBy: currentUserId,
  });

  useEffect(() => {
    setFormData((prev) => ({ ...prev, teamId, createdBy: currentUserId }));
  }, [teamId, currentUserId]);

  useEffect(() => {
    if (teamId) {
      loadTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const loadTasks = async () => {
    if (!teamId) return;
    setLoading(true);
    setError('');
    try {
      const teamTasks = await taskService.getTasksByTeamId(teamId);
      setTasks(sortTasksByDateTime(teamTasks));
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.minSignups > formData.maxSignups) {
      setError('Minimum signups cannot exceed maximum signups');
      return;
    }
    if (formData.minSignups < 0 || formData.maxSignups < 1) {
      setError('Invalid signup limits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newTask = await taskService.createTask(formData);
      setTasks((prev) => sortTasksByDateTime([...prev, newTask]));
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError('Failed to create task');
      console.error('Error creating task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    if (formData.minSignups > formData.maxSignups) {
      setError('Minimum signups cannot exceed maximum signups');
      return;
    }
    if (formData.minSignups < 0 || formData.maxSignups < 1) {
      setError('Invalid signup limits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updatedTask = await taskService.updateTask(selectedTask.id, formData);
      setTasks((prev) => {
        const updatedTasks = prev.map((task) =>
          task.id === selectedTask.id ? updatedTask : task
        );
        return sortTasksByDateTime(updatedTasks);
      });
      setShowEditModal(false);
      setSelectedTask(null);
      resetForm();
    } catch (err) {
      setError('Failed to update task');
      console.error('Error updating task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await taskService.deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (err) {
      setError('Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  const handleSignUp = async (taskId: string) => {
    try {
      const updatedTask = await taskService.signUpForTask(taskId, currentUserId);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updatedTask : task)));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('User is already signed up')) {
        console.log('User is already signed up for this task');
        loadTasks();
      } else {
        setError('Failed to sign up for task');
        console.error('Error signing up for task:', err);
      }
    }
  };

  const handleRemoveSignup = async (taskId: string) => {
    try {
      const updatedTask = await taskService.removeFromTask(taskId, currentUserId);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updatedTask : task)));
    } catch (err) {
      setError('Failed to remove signup');
      console.error('Error removing signup:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      teamId: teamId,
      name: '',
      location: '',
      description: '',
      date: '',
      startTime: '',
      timeZone: getUserTimeZone(),
      maxSignups: 10,
      minSignups: 1,
      createdBy: currentUserId,
    });
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    const parts = utcIsoToLocalParts(task.startAtUtc, task.timeZone);
    setFormData({
      teamId: task.teamId,
      name: task.name,
      location: task.location,
      description: task.description,
      date: parts.date,
      startTime: parts.startTime,
      timeZone: task.timeZone,
      maxSignups: task.maxSignups,
      minSignups: task.minSignups,
      createdBy: task.createdBy,
    });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openDetailsModal = (task: Task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setSelectedTask(null);
    setShowDetailsModal(false);
  };

  const canManageTasks = () => userRole === 'COACH';
  const isUserSignedUp = (task: Task) => task.signedUpUserIds.includes(currentUserId);

  const taskFormFields = (idPrefix: string) => (
    <>
      <div>
        <Label htmlFor={`${idPrefix}-name`}>Task Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          required
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${idPrefix}-date`}>Date</Label>
          <Input
            id={`${idPrefix}-date`}
            type="date"
            value={formData.date}
            onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-startTime`}>Start Time</Label>
          <Input
            id={`${idPrefix}-startTime`}
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
            required
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-timeZone`}>Time zone</Label>
        <Select
          value={formData.timeZone ?? viewerTimeZone}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, timeZone: value }))}
        >
          <SelectTrigger id={`${idPrefix}-timeZone`} className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeZoneOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-location`}>Location</Label>
        <Input
          id={`${idPrefix}-location`}
          value={formData.location}
          onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${idPrefix}-minSignups`}>Minimum Signups</Label>
          <Input
            id={`${idPrefix}-minSignups`}
            type="number"
            min={1}
            value={formData.minSignups}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, minSignups: parseInt(e.target.value, 10) || 1 }))
            }
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-maxSignups`}>Maximum Signups</Label>
          <Input
            id={`${idPrefix}-maxSignups`}
            type="number"
            min={1}
            value={formData.maxSignups}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, maxSignups: parseInt(e.target.value, 10) || 10 }))
            }
            required
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-description`}>Description (optional)</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={3}
          placeholder="Enter task description, details, or notes..."
          className="mt-1"
        />
      </div>
    </>
  );

  return (
    <div className="border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{teamName} Tasks</h2>
            <p className="mt-1 text-sm text-gray-600">Volunteer tasks and assignments</p>
          </div>
          {canManageTasks() && (
            <Button
              type="button"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={openCreateModal}
            >
              <Plus className="mr-2 size-4" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      <div className="p-6">
        {error && (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>No tasks scheduled for this team.</p>
            {canManageTasks() && (
              <Button
                type="button"
                className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
                onClick={openCreateModal}
              >
                <Plus className="mr-2 size-4" />
                Add Your First Task
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const currentSignups = task.signedUpUserIds.length;
              const isFull = currentSignups >= task.maxSignups;
              const hasMinimumSignups = currentSignups >= task.minSignups;
              const signedUp = isUserSignedUp(task);

              return (
                <div
                  key={task.id}
                  className="cursor-pointer border border-gray-200 p-4 transition-colors hover:border-blue-300 hover:shadow-sm"
                  onClick={() => openDetailsModal(task)}
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{task.name}</h4>
                        <Badge variant={hasMinimumSignups ? 'default' : 'outline'}>
                          {currentSignups}/{task.maxSignups} signed up
                        </Badge>
                        {!hasMinimumSignups && (
                          <Badge
                            variant="outline"
                            className="border-amber-300 bg-amber-50 text-amber-700"
                          >
                            <AlertTriangle className="size-3" />
                            Needs {task.minSignups - currentSignups} more
                          </Badge>
                        )}
                        {isFull && (
                          <Badge variant="outline" className="border-gray-300 text-gray-600">
                            Full
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-4 shrink-0" />
                          {formatScheduledDate(task.startAtUtc, viewerTimeZone)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-4 shrink-0" />
                          {formatScheduledTime(task.startAtUtc, viewerTimeZone)}
                        </span>
                        {task.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-4 shrink-0" />
                            {task.location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-4 shrink-0" />
                          Min {task.minSignups}
                        </span>
                      </div>
                      {task.description && (
                        <p className="mt-2 text-sm text-gray-600">{task.description}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {signedUp ? (
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSignup(task.id);
                          }}
                        >
                          <CheckCircle2 className="mr-1 size-4" />
                          Signed Up
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isFull}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSignUp(task.id);
                          }}
                        >
                          <XCircle className="mr-1 size-4" />
                          {isFull ? 'Full' : 'Sign Up'}
                        </Button>
                      )}
                      {canManageTasks() && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(task);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4">
            {taskFormFields('create')}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateTask} className="space-y-4">
            {taskFormFields('edit')}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Task'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {showDetailsModal && selectedTask && (
        <TaskDetailsModal task={selectedTask} onClose={closeDetailsModal} />
      )}
    </div>
  );
};

export default TaskList;
