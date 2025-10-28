import { useState } from 'react';
import { StickyNote, Plus, Pin, Edit2, Trash2, Save, X, Tag } from 'lucide-react';
import { useDepartmentNotes, type CreateNoteInput, type UpdateNoteInput } from '../../hooks/useDepartmentNotes';

interface NotesPanelProps {
  department: 'concierge' | 'sales' | 'operations' | 'finance' | 'saudemax';
  uploadId?: string;
  title?: string;
}

export function NotesPanel({ department, uploadId, title = 'Notes' }: NotesPanelProps) {
  const { notes, createNote, updateNote, deleteNote, togglePin } = useDepartmentNotes(department, uploadId);
  const [isAdding, setIsAdding] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editNoteContent, setEditNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) return;

    const input: CreateNoteInput = {
      department,
      note_content: newNoteContent,
      tags: newNoteTags,
      is_pinned: false,
    };

    if (uploadId) {
      input.upload_id = uploadId;
    }

    await createNote.mutateAsync(input);
    setNewNoteContent('');
    setNewNoteTags([]);
    setIsAdding(false);
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editNoteContent.trim()) return;

    const input: UpdateNoteInput = {
      id: noteId,
      note_content: editNoteContent,
    };

    await updateNote.mutateAsync(input);
    setEditingNoteId(null);
    setEditNoteContent('');
  };

  const handleTogglePin = async (noteId: string) => {
    await togglePin.mutateAsync(noteId);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      await deleteNote.mutateAsync(noteId);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !newNoteTags.includes(tagInput.trim())) {
      setNewNoteTags([...newNoteTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setNewNoteTags(newNoteTags.filter(t => t !== tag));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <StickyNote className="text-pink-600" size={20} />
          {title}
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? 'Cancel' : 'Add Note'}
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {isAdding && (
          <div className="border border-pink-300 rounded-lg p-4 bg-pink-50 space-y-3">
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Write your note here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              rows={4}
            />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Add tags (press Enter)"
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <button
                  onClick={addTag}
                  className="px-3 py-1.5 bg-pink-100 text-pink-700 rounded-lg text-sm hover:bg-pink-200 transition-colors"
                >
                  Add Tag
                </button>
              </div>
              {newNoteTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newNoteTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs font-medium"
                    >
                      <Tag size={12} />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-pink-900"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewNoteContent('');
                  setNewNoteTags([]);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNote}
                disabled={!newNoteContent.trim() || createNote.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                Save Note
              </button>
            </div>
          </div>
        )}

        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <StickyNote className="mx-auto mb-3 text-gray-300" size={48} />
            <p>No notes yet</p>
            <p className="text-sm mt-1">Add your first note to get started</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={`border rounded-lg p-4 ${
                note.is_pinned
                  ? 'border-pink-300 bg-pink-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              } transition-colors`}
            >
              {editingNoteId === note.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editNoteContent}
                    onChange={(e) => setEditNoteContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingNoteId(null);
                        setEditNoteContent('');
                      }}
                      className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateNote(note.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                    >
                      <Save size={14} />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {note.is_pinned && <Pin className="text-pink-600" size={16} />}
                      <span className="text-xs text-gray-500">
                        {new Date(note.created_at).toLocaleDateString()} at{' '}
                        {new Date(note.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePin(note.id)}
                        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
                          note.is_pinned ? 'text-pink-600' : 'text-gray-400'
                        }`}
                        title={note.is_pinned ? 'Unpin note' : 'Pin note'}
                      >
                        <Pin size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingNoteId(note.id);
                          setEditNoteContent(note.note_content);
                        }}
                        className="p-1.5 text-gray-400 hover:bg-gray-200 rounded transition-colors"
                        title="Edit note"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded transition-colors"
                        title="Delete note"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-900 whitespace-pre-wrap">{note.note_content}</p>

                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs font-medium"
                        >
                          <Tag size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
