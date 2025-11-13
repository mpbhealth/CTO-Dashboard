import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trash2,
  Save,
  Clock,
  Search,
  StickyNote,
  AlertCircle,
  X,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { useSimpleNotes } from '../../hooks/useSimpleNotes';

interface SimpleNotepadProps {
  dashboardRole: 'ceo' | 'cto';
  dashboardTitle?: string;
}

export default function SimpleNotepad({
  dashboardRole,
  dashboardTitle,
}: SimpleNotepadProps) {
  const category = `${dashboardRole}_dashboard`;
  const {
    notes,
    loading,
    error: hookError,
    createNote,
    deleteNote,
    refresh,
  } = useSimpleNotes(category);

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAddNote = async () => {
    if (!content.trim()) return;

    try {
      setSaving(true);
      setError(null);

      console.log('[SimpleNotepad] Creating note:', {
        dashboardRole,
        category,
        contentLength: content.length,
        hasTitle: !!title,
      });

      await createNote(content, {
        title: title || undefined,
        category,
      });

      setSaveSuccess(true);
      setContent('');
      setTitle('');

      console.log('[SimpleNotepad] Note created successfully');

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('[SimpleNotepad] Error creating note:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save note';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteNote(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.title && note.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const currentRoleLabel = dashboardRole.toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {dashboardTitle || currentRoleLabel} Notes
          </h1>
          <p className="text-slate-600 mt-2">Create and manage your personal notes</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refresh}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {(error || hookError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{error || hookError}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-800">Note saved successfully!</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <StickyNote className="w-5 h-5 text-pink-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Create New Note</h2>
          </div>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title (optional)"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-pink-500"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note here..."
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-pink-500 min-h-24"
          />
          <div className="flex justify-end">
            <button
              onClick={handleAddNote}
              disabled={saving || !content.trim()}
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Note</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-pink-500"
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
        <div className="text-sm text-slate-600">
          {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && filteredNotes.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-pulse"
            >
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
              <div className="h-24 bg-slate-100 rounded mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            </div>
          ))
        ) : filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  {note.title && (
                    <h3 className="font-semibold text-slate-900 mb-2">{note.title}</h3>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                  title="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="whitespace-pre-wrap break-words text-slate-700 mb-3">
                {note.content}
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                <span>{formatDate(note.created_at)}</span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <StickyNote className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">
              {searchTerm ? 'No notes match your search' : 'No notes yet'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-pink-600 hover:text-pink-800 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
