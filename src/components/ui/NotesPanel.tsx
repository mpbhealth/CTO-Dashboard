import { useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Note {
  id: string;
  content: string;
  created_at: string;
  updated_at?: string;
}

interface NotesPanelProps {
  notes: Note[];
  onAddNote?: (content: string) => Promise<void> | void;
  onUpdateNote?: (id: string, content: string) => Promise<void> | void;
  onDeleteNote?: (id: string) => Promise<void> | void;
  title?: string;
}

export function NotesPanel({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  title = 'Notes',
}: NotesPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !onAddNote) return;

    try {
      await onAddNote(newNoteContent);
      setNewNoteContent('');
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const handleUpdateNote = async (id: string) => {
    if (!editContent.trim() || !onUpdateNote) return;

    try {
      await onUpdateNote(id, editContent);
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!onDeleteNote) return;

    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await onDeleteNote(id);
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-md border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {onAddNote && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Note</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border border-slate-300 rounded-lg p-3"
            >
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Enter your note..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                autoFocus
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewNoteContent('');
                  }}
                  className="px-3 py-1 text-sm text-slate-700 hover:bg-slate-100 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={handleAddNote}
                  disabled={!newNoteContent.trim()}
                  className="px-3 py-1 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:bg-slate-300"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {notes.length === 0 && !isAdding ? (
          <p className="text-sm text-slate-500 text-center py-4">No notes yet</p>
        ) : (
          notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
            >
              {editingId === note.id ? (
                <>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditContent('');
                      }}
                      className="px-3 py-1 text-sm text-slate-700 hover:bg-slate-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdateNote(note.id)}
                      disabled={!editContent.trim()}
                      className="px-3 py-1 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:bg-slate-300"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-500">
                      {new Date(note.created_at).toLocaleString()}
                    </span>
                    <div className="flex items-center space-x-2">
                      {onUpdateNote && (
                        <button
                          onClick={() => startEdit(note)}
                          className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      )}
                      {onDeleteNote && (
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotesPanel;
