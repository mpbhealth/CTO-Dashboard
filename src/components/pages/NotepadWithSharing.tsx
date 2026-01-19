import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Share2,
  Users,
  Lock,
  Send,
  Eye,
  Edit3,
  UserPlus,
  Bell
} from 'lucide-react';
import { useNotes, Note, NoteShare } from '../../hooks/useNotes';

interface NotepadWithSharingProps {
  dashboardRole: 'ceo' | 'cto';
  dashboardTitle?: string;
}

export default function NotepadWithSharing({
  dashboardRole,
  dashboardTitle
}: NotepadWithSharingProps) {
  const {
    notes,
    sharedNotes,
    notifications,
    unreadCount,
    loading,
    error: hookError,
    createNote,
    updateNote,
    deleteNote,
    shareNoteWithRole,
    unshareNote,
    getNoteShares,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refresh
  } = useNotes({ dashboardRole, autoRefresh: true });

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [creationMode, setCreationMode] = useState<'personal' | 'for-other'>('personal');
  const [targetRole, _setTargetRole] = useState<'ceo' | 'cto'>(
    dashboardRole === 'ceo' ? 'cto' : 'ceo'
  );
  const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('view');
  const [shareMessage, setShareMessage] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'personal' | 'shared'>('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedNoteForSharing, setSelectedNoteForSharing] = useState<Note | null>(null);
  const [noteShares, setNoteShares] = useState<NoteShare[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Edit state
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const otherRole = dashboardRole === 'ceo' ? 'cto' : 'ceo';
  const otherRoleLabel = otherRole.toUpperCase();
  const currentRoleLabel = dashboardRole.toUpperCase();

  const handleAddNote = async () => {
    if (!content.trim()) return;

    try {
      setSaving(true);
      setError(null);

      if (creationMode === 'for-other') {
        await createNote(content, {
          title: title || undefined,
          createdForRole: targetRole,
          shareImmediately: true,
          permissionLevel: sharePermission,
          shareMessage: shareMessage || undefined
        });

        setSaveSuccess(true);
        setContent('');
        setTitle('');
        setShareMessage('');
      } else {
        await createNote(content, {
          title: title || undefined
        });

        setSaveSuccess(true);
        setContent('');
        setTitle('');
      }
    } catch (err) {
      console.error('[NotepadWithSharing] Error creating note:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save note';
      setError(errorMessage);

      // Show detailed error in console
      if (err instanceof Error && err.message.includes('column')) {
        console.error('[NotepadWithSharing] Database schema error - migration may not be applied');
        console.error('[NotepadWithSharing] Please run the migration: supabase/migrations/20251031000001_create_note_sharing_system.sql');
      }
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

  const handleOpenEdit = (note: Note) => {
    setEditingNote(note);
    setEditTitle(note.title || '');
    setEditContent(note.content);
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditTitle('');
    setEditContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingNote || !editContent.trim()) return;

    try {
      setSaving(true);
      setError(null);
      await updateNote(editingNote.id, editContent, editTitle || undefined);
      setEditingNote(null);
      setEditTitle('');
      setEditContent('');
      setSaveSuccess(true);
    } catch (err) {
      console.error('[NotepadWithSharing] Error updating note:', err);
      setError(err instanceof Error ? err.message : 'Failed to update note');
    } finally {
      setSaving(false);
    }
  };

  const handleShareNote = async () => {
    if (!selectedNoteForSharing) return;

    try {
      setSaving(true);
      setError(null);

      await shareNoteWithRole(
        selectedNoteForSharing.id,
        targetRole,
        sharePermission,
        shareMessage || undefined
      );

      setShowShareModal(false);
      setSelectedNoteForSharing(null);
      setShareMessage('');
      setSaveSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share note');
    } finally {
      setSaving(false);
    }
  };

  const openShareModal = async (note: Note) => {
    setSelectedNoteForSharing(note);
    setShowShareModal(true);

    try {
      const shares = await getNoteShares(note.id);
      setNoteShares(shares);
    } catch (err) {
      console.error('Failed to fetch shares:', err);
    }
  };

  const handleUnshare = async (noteId: string, userId?: string) => {
    try {
      await unshareNote(noteId, userId);
      setSaveSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unshare note');
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (note.title && note.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSharedNotes = sharedNotes.filter(note =>
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (note.title && note.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const displayNotes =
    viewMode === 'personal'
      ? filteredNotes
      : viewMode === 'shared'
      ? filteredSharedNotes
      : [...filteredNotes, ...filteredSharedNotes];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const resetSuccessMessage = () => {
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  if (saveSuccess) {
    resetSuccessMessage();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {dashboardTitle || currentRoleLabel} Notes
          </h1>
          <p className="text-slate-600 mt-2">
            Create personal notes or share with {otherRoleLabel} dashboard
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
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

      {showNotifications && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-xl shadow-lg border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-sm text-sky-600 hover:text-sky-800"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500">No notifications</p>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border ${
                    notif.is_read ? 'bg-slate-50 border-slate-200' : 'bg-blue-50 border-blue-200'
                  }`}
                  onClick={() => !notif.is_read && handleMarkNotificationRead(notif.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {notif.notification_type === 'shared' && 'Note shared with you'}
                        {notif.notification_type === 'edited' && 'Shared note was edited'}
                        {notif.notification_type === 'unshared' && 'Note access removed'}
                        {notif.notification_type === 'commented' && 'New comment on shared note'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{formatDate(notif.created_at)}</p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

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
              <p className="text-sm font-medium text-emerald-800">Success!</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <StickyNote className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Create New Note</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCreationMode('personal')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                creationMode === 'personal'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Lock className="w-3 h-3 inline mr-1" />
              Personal
            </button>
            <button
              onClick={() => setCreationMode('for-other')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                creationMode === 'for-other'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Send className="w-3 h-3 inline mr-1" />
              Create For...
            </button>
          </div>
        </div>

        {creationMode === 'for-other' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Creating note for {otherRoleLabel} Dashboard
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Permission
                </label>
                <select
                  value={sharePermission}
                  onChange={e => setSharePermission(e.target.value as 'view' | 'edit')}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="view">View Only</option>
                  <option value="edit">Can Edit</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Message (Optional)
              </label>
              <input
                type="text"
                value={shareMessage}
                onChange={e => setShareMessage(e.target.value)}
                placeholder="Add a message to the recipient..."
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Note title (optional)"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-indigo-500"
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your note here..."
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-indigo-500 min-h-24"
          />
          <div className="flex justify-end">
            <button
              onClick={handleAddNote}
              disabled={saving || !content.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : creationMode === 'for-other' ? (
                <>
                  <Send className="w-4 h-4" />
                  <span>Create & Share</span>
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
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-indigo-500"
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
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'all'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Notes
          </button>
          <button
            onClick={() => setViewMode('personal')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'personal'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            My Notes ({notes.length})
          </button>
          <button
            onClick={() => setViewMode('shared')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'shared'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Shared ({sharedNotes.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && displayNotes.length === 0 ? (
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
        ) : displayNotes.length > 0 ? (
          displayNotes.map(note => {
            const isShared = sharedNotes.some(sn => sn.id === note.id);
            const isOwner = notes.some(n => n.id === note.id);

            return (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    {isShared && !isOwner && (
                      <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        <Users className="w-3 h-3" />
                        <span>Shared with you</span>
                      </div>
                    )}
                    {isOwner && note.is_shared && (
                      <div className="flex items-center space-x-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        <Share2 className="w-3 h-3" />
                        <span>Shared</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {(isOwner || (isShared && note.permission_level === 'edit')) && (
                      <button
                        onClick={() => handleOpenEdit(note)}
                        className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-colors"
                        title="Edit note"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => openShareModal(note)}
                        className="text-slate-400 hover:text-sky-600 hover:bg-sky-50 p-1 rounded transition-colors"
                        title="Share note"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {note.title && (
                  <h3 className="font-semibold text-slate-900 mb-2">{note.title}</h3>
                )}
                <div className="whitespace-pre-wrap break-words text-slate-700 mb-3">
                  {note.content}
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(note.created_at)}</span>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <StickyNote className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">
              {searchTerm ? 'No notes match your search' : 'No notes yet'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit Note Modal */}
      <AnimatePresence>
        {editingNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleCancelEdit}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">Edit Note</h3>
                </div>
                <button
                  onClick={handleCancelEdit}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Note title"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    placeholder="Note content..."
                    rows={6}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving || !editContent.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Note Modal */}
      <AnimatePresence>
        {showShareModal && selectedNoteForSharing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-slate-900">Share Note</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-700 line-clamp-3">
                  {selectedNoteForSharing.content}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Share with
                  </label>
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">{otherRoleLabel} Dashboard</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Permission Level
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSharePermission('view')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        sharePermission === 'view'
                          ? 'border-sky-500 bg-sky-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Eye className="w-5 h-5 mx-auto mb-1 text-slate-700" />
                      <span className="text-sm font-medium">View Only</span>
                    </button>
                    <button
                      onClick={() => setSharePermission('edit')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        sharePermission === 'edit'
                          ? 'border-sky-500 bg-sky-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Edit3 className="w-5 h-5 mx-auto mb-1 text-slate-700" />
                      <span className="text-sm font-medium">Can Edit</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={shareMessage}
                    onChange={e => setShareMessage(e.target.value)}
                    placeholder="Add a message to explain why you're sharing..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 min-h-20"
                  />
                </div>

                {noteShares.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Currently Shared With</h4>
                    <div className="space-y-2">
                      {noteShares.map(share => (
                        <div
                          key={share.id}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-700">
                              {share.shared_with_role.toUpperCase()}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({share.permission_level})
                            </span>
                          </div>
                          <button
                            onClick={() => handleUnshare(share.note_id, share.shared_with_user_id)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Unshare
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleShareNote}
                    disabled={saving}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sharing...</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span>Share Note</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
