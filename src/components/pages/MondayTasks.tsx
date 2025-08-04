import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Download, 
  Plus, 
  ExternalLink,
  Filter,
  Search,
  X,
  FolderPlus,
  Settings,
  Zap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface MondayTask {
  id: string;
  name: string;
  board: {
    id: string;
    name: string;
  };
  group: {
    id: string;
    title: string;
  };
  column_values: Array<{
    id: string;
    text: string;
    value: string;
  }>;
  creator: {
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

interface MondayBoard {
  id: string;
  name: string;
  description: string;
  items_count: number;
}

export default function MondayTasks() {
  const [tasks, setTasks] = useState<MondayTask[]>([]);
  const [boards, setBoards] = useState<MondayBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMondayData();
  }, []);

  const fetchMondayData = async () => {
    setLoading(true);
    setError(null);

    try {
      // First fetch boards
      await fetchBoards();
      // Then fetch items from all boards
      await fetchItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Monday.com data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBoards = async () => {
    const query = `
      query {
        boards {
          id
          name
          description
          items_count
        }
      }
    `;

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/monday-api`;
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check for API-level errors
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        throw new Error(data.errors[0].message || 'Monday.com API error');
      }


      setBoards(data.data.boards);
    } catch (err) {
      // Set empty boards array on error so the UI doesn't break
      setBoards([]);
      throw err;
    }
  };

  const fetchItems = async () => {
    const query = `
      query {
        boards {
          id
          name
          groups {
            id
            title
          }
          items_page {
            items {
              id
              name
              created_at
              updated_at
              creator {
                name
                email
              }
              column_values {
                id
                text
                value
              }
            }
          }
        }
      }
    `;

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/monday-api`;
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check for API-level errors
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        throw new Error(data.errors[0].message || 'Monday.com API error');
      }

      // Validate response structure
      if (!data.data || !Array.isArray(data.data.boards)) {
        console.warn('Unexpected response structure for items:', data);
        setTasks([]); // Set empty array as fallback
        return;
      }

      // Flatten items from all boards
      const allTasks: MondayTask[] = [];
      data.data.boards.forEach((board: any) => {
        if (board.items_page && Array.isArray(board.items_page.items)) {
          board.items_page.items.forEach((item: any) => {
            allTasks.push({
              ...item,
              board: {
                id: board.id,
                name: board.name,
              },
              group: (board.groups && board.groups[0]) || { id: '', title: 'Default' },
            });
          });
        }
      });

      setTasks(allTasks);
    } catch (err) {
      console.error('Error fetching items:', err);
      // Set empty tasks array on error so the UI doesn't break
      setTasks([]);
      throw err;
    }
  };

  const syncMondayTasks = async () => {
    setSyncing(true);
    setError(null);
    
    try {
      await fetchMondayData();
      
      // Log sync operation
      await supabase
        .from('monday_sync_log')
        .insert([{
          operation: 'sync_tasks',
          status: 'success',
          message: `Synced ${tasks.length} tasks from Monday.com`,
          items_processed: tasks.length,
          errors_count: 0
        }]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to sync tasks: ' + errorMessage);
      
      // Log failed sync
      await supabase
        .from('monday_sync_log')
        .insert([{
          operation: 'sync_tasks',
          status: 'failed',
          message: errorMessage,
          items_processed: 0,
          errors_count: 1
        }]);
    } finally {
      setSyncing(false);
    }
  };

  const importSelectedTasks = async () => {
    if (selectedTasks.size === 0) {
      alert('Please select tasks to import');
      return;
    }

    try {
      const tasksToImport = tasks.filter(task => selectedTasks.has(task.id));
      
      for (const task of tasksToImport) {
        // Get status from column values (look for common status column IDs)
        const statusColumn = task.column_values.find(col => 
          col.id === 'status' || col.id === 'status_1' || (col.text && col.text.includes('Done')) || (col.text && col.text.includes('Working'))
        );
        const status = statusColumn?.text || 'Planning';
        
        // Get assignees from column values (look for person columns)
        const assigneeColumn = task.column_values.find(col => 
          col.id.includes('person') || (col.text && col.text.includes('@'))
        );
        const assignees = assigneeColumn?.text ? [assigneeColumn.text] : [task.creator?.name || 'Unknown'];

        // Create project from Monday task
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert([{
            name: task.name,
            description: `Imported from Monday.com board: ${task.board.name}`,
            status: status === 'Done' ? 'Live' : status === 'Working on it' ? 'Building' : 'Planning',
            team: assignees,
            monday_link: `https://mpbhealth.monday.com/boards/${task.board.id}/pulses/${task.id}`,
            website_url: '',
            progress: status === 'Done' ? 100 : status === 'Working on it' ? 50 : 0
          }])
          .select()
          .single();

        if (projectError) throw projectError;

        // Store task in our database
        await supabase
          .from('monday_tasks')
          .upsert([{
            monday_item_id: task.id,
            board_id: task.board.id,
            board_name: task.board.name,
            group_id: task.group.id,
            group_name: task.group.title,
            name: task.name,
            status: statusColumn?.text || 'Backlog',
            priority: 'Medium', // Default priority
            assignees: assignees,
            description: `Created by ${task.creator?.name || 'Unknown'}`,
            labels: [],
            project_id: project.id,
            is_imported: true,
            raw_data: task,
            last_updated: task.updated_at
          }], { onConflict: 'monday_item_id' });
      }

      setSelectedTasks(new Set());
      alert(`Successfully imported ${tasksToImport.length} tasks as projects!`);
      
    } catch (err) {
      alert('Failed to import tasks: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const creatorName = task.creator?.name || '';
    const matchesSearch = searchTerm === '' || 
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creatorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBoard = selectedBoard === 'All' || task.board.name === selectedBoard;
    
    const statusColumn = task.column_values.find(col => 
      col.id === 'status' || col.id === 'status_1' || (col.text && col.text.includes('Done')) || (col.text && col.text.includes('Working'))
    );
    const taskStatus = statusColumn?.text || 'Backlog';
    const matchesStatus = selectedStatus === 'All' || taskStatus === selectedStatus;
    
    return matchesSearch && matchesBoard && matchesStatus;
  });

  const boardNames = ['All', ...Array.from(new Set(tasks.map(task => task.board.name)))];
  const statuses = ['All', ...Array.from(new Set(tasks.map(task => {
    const statusColumn = task.column_values.find(col => 
      col.id === 'status' || col.id === 'status_1' || (col.text && col.text.includes('Done')) || (col.text && col.text.includes('Working'))
    );
    return statusColumn?.text || 'Backlog';
  })))];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done':
        return 'bg-emerald-100 text-emerald-800';
      case 'working on it':
        return 'bg-blue-100 text-blue-800';
      case 'stuck':
        return 'bg-red-100 text-red-800';
      case 'waiting for review':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const clearFilters = () => {
    setSelectedBoard('All');
    setSelectedStatus('All');
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Monday.com Tasks</h1>
          <p className="text-slate-600 mt-2">Import and manage tasks from Monday.com boards</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={syncMondayTasks}
            disabled={syncing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Tasks'}</span>
          </button>
          
          {selectedTasks.size > 0 && (
            <button
              onClick={importSelectedTasks}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Import Selected ({selectedTasks.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-semibold text-emerald-900">Monday.com Connected</h3>
            <p className="text-sm text-emerald-800">
              Found {boards.length} boards with {tasks.length} total items
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks, creators..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
            >
              {boardNames.map(board => (
                <option key={board} value={board}>{board === 'All' ? 'All Boards' : board}</option>
              ))}
            </select>
            <select
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status === 'All' ? 'All Statuses' : status}</option>
              ))}
            </select>
            {(selectedBoard !== 'All' || selectedStatus !== 'All' || searchTerm) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="space-y-4">
        {filteredTasks.map((task) => {
          const statusColumn = task.column_values.find(col => 
            col.id === 'status' || col.id === 'status_1' || (col.text && col.text.includes('Done')) || (col.text && col.text.includes('Working'))
          );
          const status = statusColumn?.text || 'Backlog';
          
          const assigneeColumn = task.column_values.find(col => 
            col.id.includes('person') || (col.text && col.text.includes('@'))
          );
          const assignee = assigneeColumn?.text || task.creator?.name || 'Unknown';

          return (
            <motion.div 
              key={task.id} 
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start space-x-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedTasks.has(task.id)}
                  onChange={(e) => {
                    const newSelected = new Set(selectedTasks);
                    if (e.target.checked) {
                      newSelected.add(task.id);
                    } else {
                      newSelected.delete(task.id);
                    }
                    setSelectedTasks(newSelected);
                  }}
                  className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />

                {/* Task Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">{task.name}</h3>
                      <p className="text-sm text-slate-600">{task.board.name} • {task.group.title}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-700">{assignee}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-700">
                        Created: {new Date(task.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-700">
                        Updated: {new Date(task.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200">
                    <span className="text-xs text-slate-500">
                      Created by: {task.creator?.name || 'Unknown'}
                    </span>
                    <a
                      href={`https://mpbhealth.monday.com/boards/${task.board.id}/pulses/${task.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View in Monday.com</span>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredTasks.length === 0 && !loading && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">No tasks found matching your criteria.</p>
            {tasks.length === 0 ? (
              <button
                onClick={syncMondayTasks}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Sync tasks from Monday.com to get started
              </button>
            ) : (
              <button
                onClick={clearFilters}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}