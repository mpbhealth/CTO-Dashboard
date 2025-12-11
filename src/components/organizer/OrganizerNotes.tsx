import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  StickyNote,
  Plus,
  Trash2,
  Clock,
  RefreshCw,
  Save,
  X,
  Pin,
  Share2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useNotes, Note } from '../../hooks/useNotes';

interface OrganizerNotesProps {
  dashboardRole: 'ceo' | 'cto';
  maxNotes?: number;
}

export default function OrganizerNotes({ dashboardRole, maxNotes = 5 }: OrganizerNotesProps) {
  const {
    notes,
    sharedNotes,
    loading,
    error,
    isInDemoMode,
    createNote,
    deleteNote,
    refresh
  } = useNotes({ dashboardRole, autoRefresh: true });

  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Combine and sort notes
  const allNotes = [...notes, ...sharedNotes]
    .sort((a, b) => {
      // Pinned notes first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      // Then by date
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, maxNotes);

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    try {
      setSaving(true);
      setSaveError(null);
      
      await createNote(newNoteContent, {
        title: newNoteTitle || undefined,
      });

      setNewNoteContent('');
      setNewNoteTitle('');
      setShowAddNote(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    
    try {
      await deleteNote(id);
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <StickyNote className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Quick Notes</h3>
          </div>
          <div className="flex items-center space-x-2">
            {isInDemoMode && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Demo</span>
            )}
            <button
              onClick={() => setShowAddNote(true)}
              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
              title="Add note"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={refresh}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        </div>
      )}

      {/* Success Message */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-4 mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg"
          >
            <div className="flex items-center space-x-2 text-sm text-emerald-700">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Note saved!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && allNotes.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : allNotes.length === 0 ? (
          <div className="text-center py-8">
            <StickyNote className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No notes yet</p>
            <button
              onClick={() => setShowAddNote(true)}
              className="mt-2 text-sm text-amber-600 hover:text-amber-700"
            >
              Create your first note
            </button>
          </div>
        ) : (
          allNotes.map(note => (
            <motion.div
              key={note.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg group hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {note.title && (
                    <h4 className="font-medium text-slate-900 text-sm truncate">{note.title}</h4>
                  )}
                  <p className="text-sm text-slate-700 line-clamp-2 mt-0.5">{note.content}</p>
                  <div className="flex items-center space-x-2 mt-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(note.created_at)}</span>
                    {note.is_pinned && (
                      <Pin className="w-3 h-3 text-amber-500" />
                    )}
                    {note.is_shared && (
                      <Share2 className="w-3 h-3 text-sky-500" />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Add Form (inline) */}
      <AnimatePresence>
        {showAddNote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-200"
          >
            <div className="p-4 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">New Note</span>
                <button
                  onClick={() => setShowAddNote(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {saveError && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  {saveError}
                </div>
              )}

              <input
                type="text"
                value={newNoteTitle}
                onChange={e => setNewNoteTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-2"
              />
              <textarea
                value={newNoteContent}
                onChange={e => setNewNoteContent(e.target.value)}
                placeholder="Write your note..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleAddNote}
                  disabled={saving || !newNoteContent.trim()}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      {allNotes.length > 0 && notes.length > maxNotes && (
        <div className="p-3 border-t border-slate-200 text-center">
          <span className="text-xs text-slate-500">
            Showing {maxNotes} of {notes.length + sharedNotes.length} notes
          </span>
        </div>
      )}
    </div>
  );
}
