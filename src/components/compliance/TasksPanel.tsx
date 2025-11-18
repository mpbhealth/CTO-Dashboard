import React, { useState } from 'react';
import { Plus, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTasks, useCreateTask, useUpdateTask } from '../../hooks/useComplianceData';
import { TaskStatusChip, PriorityChip } from './ComplianceChips';
import type { TaskStatus, TaskPriority, DocSection } from '../../types/compliance';

interface TasksPanelProps {
  linkedTable?: string;
  linkedId?: string;
  section?: DocSection | string;
  showCreateButton?: boolean;
}

export const TasksPanel: React.FC<TasksPanelProps> = ({
  linkedTable,
  linkedId,
  section,
  showCreateButton = true,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    due_date: '',
    assignee: '',
  });

  const { data: tasks = [], isLoading } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const filteredTasks = tasks.filter(task => {
    if (linkedTable && linkedId) {
      return task.linked_table === linkedTable && task.linked_id === linkedId;
    }
    if (section) {
      return task.section === section;
    }
    return true;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createTask.mutateAsync({
        ...newTask,
        section: section || 'administration',
        linked_table: linkedTable,
        linked_id: linkedId,
      });

      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        assignee: '',
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        updates: { status: newStatus, updated_at: new Date().toISOString() },
      });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Tasks ({filteredTasks.length})
        </h3>
        {showCreateButton && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateTask} className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-pink-500"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-pink-500"
              placeholder="Task description"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-pink-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-pink-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTask.isPending}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-300"
            >
              {createTask.isPending ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      )}

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:border-pink-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    {isOverdue(task.due_date) && task.status !== 'done' && (
                      <span className="text-xs text-red-600 font-medium">OVERDUE</span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TaskStatusChip status={task.status} size="sm" />
                  <PriorityChip priority={task.priority} size="sm" />
                  {task.due_date && (
                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(task.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-1">
                  {task.status !== 'done' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'done')}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      title="Mark as done"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                    className="text-xs px-2 py-1 border border-gray-300 rounded hover:border-pink-300"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

