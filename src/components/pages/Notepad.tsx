import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  StickyNote, 
  Plus, 
  Search, 
  Filter, 
  Save, 
  Trash2, 
  Edit3, 
  Share2, 
  Download, 
  Mail, 
  Copy, 
  Link, 
  FileText, 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  Star, 
  StarOff, 
  Pin, 
  PinOff, 
  Eye, 
  EyeOff, 
  MoreHorizontal, 
  X, 
  Check, 
  AlertCircle, 
  Send, 
  Paperclip, 
  FolderOpen, 
  Archive, 
  RefreshCw,
  Maximize,
  Minimize,
  Type,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Palette,
  Settings,
  Grid3X3,
  LayoutList
} from 'lucide-react';
import { useProjects } from '../../hooks/useSupabaseData';

interface Note {
  id: string;
  title: string;
  content: string;
  project_id?: string;
  project_name?: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  is_pinned: boolean;
  is_starred: boolean;
  is_private: boolean;
  color: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  reminder_date?: string;
}

interface ShareModalProps {
  note: Note;
  onClose: () => void;
  onShare: (method: string, data: any) => void;
}

const NOTE_COLORS = [
  { name: 'Yellow', value: '#FEF3C7', border: '#F59E0B' },
  { name: 'Blue', value: '#DBEAFE', border: '#3B82F6' },
  { name: 'Green', value: '#D1FAE5', border: '#10B981' },
  { name: 'Purple', value: '#E9D5FF', border: '#8B5CF6' },
  { name: 'Pink', value: '#FCE7F3', border: '#EC4899' },
  { name: 'Orange', value: '#FED7AA', border: '#F97316' },
  { name: 'Red', value: '#FEE2E2', border: '#EF4444' },
  { name: 'Gray', value: '#F3F4F6', border: '#6B7280' }
];

export default function Notepad() {
  const { data: projects } = useProjects();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState<Partial<Note>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mock data - in a real app, this would come from your database
  useEffect(() => {
    const mockNotes: Note[] = [
      {
        id: '1',
        title: 'CEO Meeting Notes',
        content: 'Discussed Q1 priorities:\n- Focus on member retention\n- Accelerate AI integration\n- Review SaaS spend optimization\n\nAction items:\n- Schedule follow-up with product team\n- Prepare budget analysis\n- Update roadmap timeline',
        project_id: 'proj-1',
        project_name: 'MPB Health APP Suite',
        tags: ['meeting', 'priorities', 'Q1'],
        priority: 'high',
        is_pinned: true,
        is_starred: true,
        is_private: false,
        color: '#FEF3C7',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'vinnie',
        reminder_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        title: 'Tech Stack Review',
        content: 'Current technology assessment:\n\n✅ React/TypeScript - Excellent\n✅ Supabase - Performing well\n⚠️ Legacy PHP systems - Need migration plan\n❌ Old jQuery components - Priority for replacement\n\nNext steps:\n- Create migration timeline\n- Assess resource requirements\n- Plan phased approach',
        tags: ['tech-stack', 'review', 'migration'],
        priority: 'medium',
        is_pinned: false,
        is_starred: false,
        is_private: false,
        color: '#DBEAFE',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        created_by: 'vinnie'
      },
      {
        id: '3',
        title: 'Security Audit Findings',
        content: 'CONFIDENTIAL - Security Review Results\n\n🔒 Critical Issues:\n- Update SSL certificates (expires next month)\n- Patch authentication system\n- Review API rate limiting\n\n📋 Recommendations:\n- Implement 2FA for admin accounts\n- Regular penetration testing\n- Update security policies',
        tags: ['security', 'audit', 'confidential'],
        priority: 'high',
        is_pinned: true,
        is_starred: false,
        is_private: true,
        color: '#FEE2E2',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        created_by: 'vinnie'
      },
      {
        id: '4',
        title: 'AI Integration Ideas',
        content: 'Brainstorming session outcomes:\n\n🤖 Potential AI Applications:\n- Automated customer support\n- Predictive analytics for member health\n- Smart document processing\n- Personalized recommendations\n\n💡 Quick Wins:\n- Chatbot for FAQ\n- Email categorization\n- Data entry automation',
        project_id: 'proj-2',
        project_name: 'CarePilot AI',
        tags: ['ai', 'innovation', 'brainstorming'],
        priority: 'medium',
        is_pinned: false,
        is_starred: true,
        is_private: false,
        color: '#E9D5FF',
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        created_by: 'vinnie'
      },
      {
        id: '5',
        title: 'Budget Planning Notes',
        content: 'Q2 Budget Review:\n\n💰 Current Spend:\n- SaaS tools: $45K/month\n- Infrastructure: $12K/month\n- Team costs: $180K/month\n\n📊 Optimization opportunities:\n- Consolidate duplicate tools\n- Negotiate better rates\n- Review unused licenses\n\nTarget: 15% reduction by Q3',
        tags: ['budget', 'planning', 'optimization'],
        priority: 'high',
        is_pinned: false,
        is_starred: false,
        is_private: false,
        color: '#D1FAE5',
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        created_by: 'vinnie'
      }
    ];
    setNotes(mockNotes);
  }, []);

  // Filter notes based on search and filters
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchTerm === '' || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesProject = selectedProject === 'All' || note.project_name === selectedProject;
    const matchesPriority = selectedPriority === 'All' || note.priority === selectedPriority;
    const matchesStarred = !showStarredOnly || note.is_starred;
    const matchesPinned = !showPinnedOnly || note.is_pinned;
    
    return matchesSearch && matchesProject && matchesPriority && matchesStarred && matchesPinned;
  });

  // Sort notes: pinned first, then by updated date
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Note',
      content: '',
      tags: [],
      priority: 'medium',
      is_pinned: false,
      is_starred: false,
      is_private: false,
      color: '#FEF3C7',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'vinnie'
    };
    
    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
    setIsEditing(true);
    setEditingNote(newNote);
    setIsCreating(true);
  };

  const handleSaveNote = () => {
    if (!editingNote.id) return;
    
    const updatedNotes = notes.map(note => 
      note.id === editingNote.id 
        ? { ...note, ...editingNote, updated_at: new Date().toISOString() }
        : note
    );
    
    setNotes(updatedNotes);
    setSelectedNote({ ...selectedNote!, ...editingNote });
    setIsEditing(false);
    setIsCreating(false);
    setEditingNote({});
  };

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      setNotes(notes.filter(note => note.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    }
  };

  const handleToggleStar = (noteId: string) => {
    const updatedNotes = notes.map(note => 
      note.id === noteId 
        ? { ...note, is_starred: !note.is_starred, updated_at: new Date().toISOString() }
        : note
    );
    setNotes(updatedNotes);
    if (selectedNote?.id === noteId) {
      setSelectedNote({ ...selectedNote, is_starred: !selectedNote.is_starred });
    }
  };

  const handleTogglePin = (noteId: string) => {
    const updatedNotes = notes.map(note => 
      note.id === noteId 
        ? { ...note, is_pinned: !note.is_pinned, updated_at: new Date().toISOString() }
        : note
    );
    setNotes(updatedNotes);
    if (selectedNote?.id === noteId) {
      setSelectedNote({ ...selectedNote, is_pinned: !selectedNote.is_pinned });
    }
  };

  const handleShare = (method: string, data: any) => {
    if (!selectedNote) return;
    
    switch (method) {
      case 'email':
        const subject = encodeURIComponent(`Note: ${selectedNote.title}`);
        const body = encodeURIComponent(`${selectedNote.content}\n\n---\nShared from MPB Health CTO Dashboard`);
        window.open(`mailto:${data.email}?subject=${subject}&body=${body}`);
        break;
      
      case 'copy':
        navigator.clipboard.writeText(`${selectedNote.title}\n\n${selectedNote.content}`);
        alert('Note copied to clipboard!');
        break;
      
      case 'download':
        const element = document.createElement('a');
        const file = new Blob([`${selectedNote.title}\n\n${selectedNote.content}`], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${selectedNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        break;
    }
    
    setShowShareModal(false);
  };

  const handleExportAll = () => {
    const allNotesContent = notes.map(note => 
      `${note.title}\n${'='.repeat(note.title.length)}\n\n${note.content}\n\nTags: ${note.tags.join(', ')}\nPriority: ${note.priority}\nCreated: ${new Date(note.created_at).toLocaleString()}\n\n---\n\n`
    ).join('');
    
    const element = document.createElement('a');
    const file = new Blob([allNotesContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `mpb_health_notes_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportJSON = () => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `mpb_health_notes_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportPDF = () => {
    alert('PDF export functionality would be implemented here with jsPDF');
    // In a real implementation, you would use jsPDF to generate a PDF
  };

  const handleAddTag = (tag: string) => {
    if (!editingNote.id) return;
    
    const tags = editingNote.tags || [];
    if (!tags.includes(tag)) {
      setEditingNote({ ...editingNote, tags: [...tags, tag] });
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (!editingNote.id) return;
    
    const tags = editingNote.tags || [];
    setEditingNote({ ...editingNote, tags: tags.filter(t => t !== tag) });
  };

  const handleChangeColor = (color: string) => {
    if (!editingNote.id) return;
    setEditingNote({ ...editingNote, color });
  };

  const handleSetReminder = (date: string) => {
    if (!editingNote.id) return;
    setEditingNote({ ...editingNote, reminder_date: date });
  };

  const handleTogglePrivate = () => {
    if (!editingNote.id) return;
    setEditingNote({ ...editingNote, is_private: !(editingNote.is_private || false) });
  };

  const handleAssignProject = (projectId: string, projectName: string) => {
    if (!editingNote.id) return;
    setEditingNote({ ...editingNote, project_id: projectId, project_name: projectName });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedProject('All');
    setSelectedPriority('All');
    setShowStarredOnly(false);
    setShowPinnedOnly(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedProject !== 'All') count++;
    if (selectedPriority !== 'All') count++;
    if (showStarredOnly) count++;
    if (showPinnedOnly) count++;
    return count;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-full'}`}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <StickyNote className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-semibold text-slate-900">Notepad</h1>
            </div>
            <div className="text-sm text-slate-600">
              {notes.length} note{notes.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
            >
              {viewMode === 'grid' ? <LayoutList className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
            </button>
            
            <button
              onClick={handleCreateNote}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Note</span>
            </button>
            
            <div className="relative group">
              <button
                className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Export options"
              >
                <Download className="w-5 h-5" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 hidden group-hover:block z-10">
                <div className="p-2">
                  <button
                    onClick={handleExportAll}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span className="text-sm">Export as Text</span>
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Code className="w-4 h-4 text-slate-600" />
                    <span className="text-sm">Export as JSON</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span className="text-sm">Export as PDF</span>
                  </button>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes..."
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
          
          <div className="flex items-center space-x-2">
            <select
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="All">All Projects</option>
              {projects?.map(project => (
                <option key={project.id} value={project.name}>{project.name}</option>
              ))}
              <option value="None">No Project</option>
            </select>
            
            <select
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <button
              onClick={() => setShowStarredOnly(!showStarredOnly)}
              className={`p-2 rounded-lg transition-colors ${
                showStarredOnly ? 'bg-amber-100 text-amber-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title={showStarredOnly ? 'Show all notes' : 'Show starred only'}
            >
              <Star className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
              className={`p-2 rounded-lg transition-colors ${
                showPinnedOnly ? 'bg-indigo-100 text-indigo-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title={showPinnedOnly ? 'Show all notes' : 'Show pinned only'}
            >
              <Pin className="w-5 h-5" />
            </button>
            
            {getActiveFilterCount() > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                <span className="text-sm">Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Notes List */}
        <div className={`${selectedNote && !isFullscreen ? 'w-1/3' : 'w-full'} border-r border-slate-200 overflow-y-auto`}>
          {viewMode === 'grid' ? (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedNotes.map(note => (
                <div
                  key={note.id}
                  className={`relative rounded-lg shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                    selectedNote?.id === note.id ? 'ring-2 ring-indigo-500' : ''
                  }`}
                  style={{ backgroundColor: note.color }}
                  onClick={() => setSelectedNote(note)}
                >
                  {/* Note Header */}
                  <div className="p-4 border-b" style={{ borderColor: NOTE_COLORS.find(c => c.value === note.color)?.border || '#E5E7EB' }}>
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-slate-900 line-clamp-1">{note.title}</h3>
                      <div className="flex items-center space-x-1">
                        {note.is_pinned && <Pin className="w-4 h-4 text-indigo-600" />}
                        {note.is_starred && <Star className="w-4 h-4 text-amber-500" />}
                        {note.is_private && <Eye className="w-4 h-4 text-slate-500" />}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(note.priority)}`}>
                        {note.priority}
                      </span>
                      {note.project_name && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                          {note.project_name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Note Preview */}
                  <div className="p-4">
                    <p className="text-sm text-slate-700 line-clamp-3 whitespace-pre-line">
                      {note.content}
                    </p>
                  </div>
                  
                  {/* Note Footer */}
                  <div className="px-4 py-2 bg-white bg-opacity-50 text-xs text-slate-500 flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(note.updated_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {note.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 2 && (
                        <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">
                          +{note.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {sortedNotes.map(note => (
                <div
                  key={note.id}
                  className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                    selectedNote?.id === note.id ? 'bg-indigo-50' : ''
                  }`}
                  onClick={() => setSelectedNote(note)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: NOTE_COLORS.find(c => c.value === note.color)?.border || '#E5E7EB' }}
                        ></div>
                        <h3 className="font-medium text-slate-900">{note.title}</h3>
                        <div className="flex items-center space-x-1">
                          {note.is_pinned && <Pin className="w-4 h-4 text-indigo-600" />}
                          {note.is_starred && <Star className="w-4 h-4 text-amber-500" />}
                          {note.is_private && <Eye className="w-4 h-4 text-slate-500" />}
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-1 mt-1">
                        {note.content}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(note.priority)}`}>
                        {note.priority}
                      </span>
                      <span className="text-xs text-slate-500 mt-1">
                        {formatDate(note.updated_at)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-1">
                      {note.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-xs">
                          +{note.tags.length - 3}
                        </span>
                      )}
                    </div>
                    {note.project_name && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                        {note.project_name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {sortedNotes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64">
              <StickyNote className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500 mb-4">No notes found</p>
              <button
                onClick={handleCreateNote}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create a new note</span>
              </button>
            </div>
          )}
        </div>

        {/* Note Detail */}
        {selectedNote && (
          <div className={`${isFullscreen ? 'w-full' : 'w-2/3'} flex flex-col bg-white`}>
            {isEditing ? (
              <div className="flex-1 flex flex-col">
                {/* Edit Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={editingNote.title || selectedNote.title}
                      onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                      className="text-xl font-semibold text-slate-900 border-b-2 border-indigo-500 focus:outline-none"
                      placeholder="Note title"
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSaveNote}
                        className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditingNote({});
                          setIsCreating(false);
                        }}
                        className="flex items-center space-x-1 px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Edit Toolbar */}
                <div className="bg-white border-b border-slate-200 px-6 py-2">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <button className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors">
                        <Bold className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors">
                        <Italic className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors">
                        <Underline className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors">
                        <List className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors">
                        <ListOrdered className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <select
                        value={editingNote.priority || selectedNote.priority}
                        onChange={(e) => setEditingNote({ ...editingNote, priority: e.target.value as any })}
                        className="px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <div className="relative group">
                        <button className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors">
                          <Palette className="w-4 h-4" />
                        </button>
                        <div className="absolute left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-slate-200 hidden group-hover:block z-10">
                          <div className="grid grid-cols-4 gap-1">
                            {NOTE_COLORS.map(color => (
                              <button
                                key={color.name}
                                className="w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform"
                                style={{ backgroundColor: color.value, borderColor: color.border }}
                                onClick={() => handleChangeColor(color.value)}
                                title={color.name}
                              ></button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <div className="relative group">
                        <button className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors">
                          <Tag className="w-4 h-4" />
                        </button>
                        <div className="absolute left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-slate-200 hidden group-hover:block z-10 w-64">
                          <div className="mb-2">
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                placeholder="Add tag..."
                                className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.currentTarget.value) {
                                    handleAddTag(e.currentTarget.value);
                                    e.currentTarget.value = '';
                                  }
                                }}
                              />
                              <button
                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                onClick={() => {
                                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                  if (input.value) {
                                    handleAddTag(input.value);
                                    input.value = '';
                                  }
                                }}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                            {(editingNote.tags || selectedNote.tags).map(tag => (
                              <div key={tag} className="flex items-center space-x-1 px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                                <span>{tag}</span>
                                <button
                                  className="text-slate-500 hover:text-red-600"
                                  onClick={() => handleRemoveTag(tag)}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <div className="relative group">
                        <button className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors">
                          <FolderOpen className="w-4 h-4" />
                        </button>
                        <div className="absolute left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-slate-200 hidden group-hover:block z-10 w-64">
                          <div className="max-h-48 overflow-y-auto">
                            <button
                              className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-slate-50 rounded-lg transition-colors"
                              onClick={() => handleAssignProject('', '')}
                            >
                              <span className="text-sm">No Project</span>
                            </button>
                            {projects?.map(project => (
                              <button
                                key={project.id}
                                className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-slate-50 rounded-lg transition-colors"
                                onClick={() => handleAssignProject(project.id, project.name)}
                              >
                                <span className="text-sm">{project.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        className={`p-1 rounded transition-colors ${
                          editingNote.is_private || selectedNote.is_private
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                        onClick={handleTogglePrivate}
                        title={editingNote.is_private || selectedNote.is_private ? 'Make public' : 'Make private'}
                      >
                        {editingNote.is_private || selectedNote.is_private ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <div className="relative group">
                        <button className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors">
                          <Calendar className="w-4 h-4" />
                        </button>
                        <div className="absolute left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-slate-200 hidden group-hover:block z-10 w-64">
                          <div className="mb-2">
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Set Reminder
                            </label>
                            <input
                              type="datetime-local"
                              className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              value={(editingNote.reminder_date || selectedNote.reminder_date || '').slice(0, 16)}
                              onChange={(e) => handleSetReminder(e.target.value)}
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                              onClick={() => handleSetReminder('')}
                            >
                              Clear Reminder
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Edit Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <textarea
                    ref={textareaRef}
                    value={editingNote.content !== undefined ? editingNote.content : selectedNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    className="w-full h-full p-4 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    placeholder="Write your note here..."
                    style={{ backgroundColor: editingNote.color || selectedNote.color }}
                  ></textarea>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {/* View Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">{selectedNote.title}</h2>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setEditingNote({});
                          setTimeout(() => {
                            if (textareaRef.current) {
                              textareaRef.current.focus();
                            }
                          }, 100);
                        }}
                        className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setShowShareModal(true)}
                        className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Share note"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStar(selectedNote.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          selectedNote.is_starred ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                        title={selectedNote.is_starred ? 'Remove from starred' : 'Add to starred'}
                      >
                        {selectedNote.is_starred ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleTogglePin(selectedNote.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          selectedNote.is_pinned ? 'text-indigo-600 hover:bg-indigo-50' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                        title={selectedNote.is_pinned ? 'Unpin note' : 'Pin note'}
                      >
                        {selectedNote.is_pinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteNote(selectedNote.id)}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Note Metadata */}
                <div className="bg-white border-b border-slate-200 px-6 py-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-600">
                        Updated {formatDate(selectedNote.updated_at)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(selectedNote.priority)}`}>
                        {selectedNote.priority} priority
                      </span>
                    </div>
                    
                    {selectedNote.project_name && (
                      <div className="flex items-center space-x-1">
                        <FolderOpen className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-600">
                          {selectedNote.project_name}
                        </span>
                      </div>
                    )}
                    
                    {selectedNote.is_private && (
                      <div className="flex items-center space-x-1">
                        <EyeOff className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-600">
                          Private
                        </span>
                      </div>
                    )}
                    
                    {selectedNote.reminder_date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-purple-600">
                          Reminder: {new Date(selectedNote.reminder_date).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Tags */}
                {selectedNote.tags.length > 0 && (
                  <div className="bg-white border-b border-slate-200 px-6 py-2">
                    <div className="flex items-center flex-wrap gap-2">
                      <Tag className="w-4 h-4 text-slate-500" />
                      {selectedNote.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Note Content */}
                <div 
                  className="flex-1 p-6 overflow-y-auto"
                  style={{ backgroundColor: selectedNote.color }}
                >
                  <div className="max-w-3xl mx-auto">
                    <pre className="whitespace-pre-wrap font-sans text-slate-900">
                      {selectedNote.content}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {!selectedNote && !isFullscreen && (
          <div className="w-2/3 flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <StickyNote className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">No note selected</h3>
              <p className="text-slate-500 mb-4">Select a note from the list or create a new one</p>
              <button
                onClick={handleCreateNote}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create a new note</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && selectedNote && (
          <ShareModal 
            note={selectedNote} 
            onClose={() => setShowShareModal(false)} 
            onShare={handleShare}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Share Modal Component
function ShareModal({ note, onClose, onShare }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState('email');
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Share Note</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-4">
            <button
              className={`flex-1 py-2 text-sm font-medium ${
                activeTab === 'email'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('email')}
            >
              Email
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium ${
                activeTab === 'copy'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('copy')}
            >
              Copy
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium ${
                activeTab === 'download'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('download')}
            >
              Download
            </button>
          </div>
          
          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="colleague@mpbhealth.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Note Preview
                </label>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-medium text-slate-900">{note.title}</h3>
                  <p className="text-sm text-slate-700 line-clamp-3 mt-1">
                    {note.content}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => onShare('email', { email })}
                  disabled={!email}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Email</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Copy Tab */}
          {activeTab === 'copy' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Note Content
                </label>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-48 overflow-y-auto">
                  <h3 className="font-medium text-slate-900">{note.title}</h3>
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans mt-2">
                    {note.content}
                  </pre>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => onShare('copy', {})}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy to Clipboard</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Download Tab */}
          {activeTab === 'download' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Download Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => onShare('download', { format: 'txt' })}
                    className="flex flex-col items-center p-3 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                  >
                    <FileText className="w-8 h-8 text-slate-600 mb-2" />
                    <span className="text-sm font-medium">Text File</span>
                    <span className="text-xs text-slate-500">.txt</span>
                  </button>
                  <button
                    onClick={() => onShare('download', { format: 'md' })}
                    className="flex flex-col items-center p-3 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                  >
                    <Code className="w-8 h-8 text-slate-600 mb-2" />
                    <span className="text-sm font-medium">Markdown</span>
                    <span className="text-xs text-slate-500">.md</span>
                  </button>
                  <button
                    onClick={() => onShare('download', { format: 'pdf' })}
                    className="flex flex-col items-center p-3 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                  >
                    <FileText className="w-8 h-8 text-slate-600 mb-2" />
                    <span className="text-sm font-medium">PDF File</span>
                    <span className="text-xs text-slate-500">.pdf</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}