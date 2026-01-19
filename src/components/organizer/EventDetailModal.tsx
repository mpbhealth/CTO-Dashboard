import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  MapPin,
  Users,
  Video,
  ExternalLink,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Mail
} from 'lucide-react';
import { CalendarEvent } from '../../hooks/useOutlookCalendar';

interface EventDetailModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (eventId: string) => Promise<void>;
  onEdit?: (event: CalendarEvent) => void;
  isConnected: boolean;
}

export default function EventDetailModal({
  event,
  isOpen,
  onClose,
  onDelete,
  onEdit: _onEdit,
  isConnected
}: EventDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString([], { 
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDuration = () => {
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} minutes`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  };

  const getImportanceColor = () => {
    switch (event.importance) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'low': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-sky-100 text-sky-700 border-sky-200';
    }
  };

  const getShowAsColor = () => {
    switch (event.showAs) {
      case 'free': return 'bg-emerald-100 text-emerald-700';
      case 'tentative': return 'bg-amber-100 text-amber-700';
      case 'busy': return 'bg-sky-100 text-sky-700';
      case 'oof': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await onDelete(event.id);
      onClose();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete event');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-6 border-b ${getImportanceColor()}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-5 h-5" />
                  {event.importance === 'high' && (
                    <span className="text-xs font-medium bg-red-200 text-red-800 px-2 py-0.5 rounded">
                      High Priority
                    </span>
                  )}
                  {event.isOnlineMeeting && (
                    <span className="text-xs font-medium bg-blue-200 text-blue-800 px-2 py-0.5 rounded flex items-center space-x-1">
                      <Video className="w-3 h-3" />
                      <span>Online</span>
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold">{event.subject}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-black/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Date & Time */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{formatDate(event.start.dateTime)}</p>
                <p className="text-slate-600">
                  {event.isAllDay ? (
                    'All day'
                  ) : (
                    <>
                      {formatTime(event.start.dateTime)} - {formatTime(event.end.dateTime)}
                      <span className="text-slate-400 ml-2">({getDuration()})</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Location */}
            {event.location?.displayName && (
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Location</p>
                  <p className="text-slate-600">{event.location.displayName}</p>
                </div>
              </div>
            )}

            {/* Online Meeting */}
            {event.isOnlineMeeting && event.onlineMeetingUrl && (
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Video className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Online Meeting</p>
                  <a
                    href={event.onlineMeetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                  >
                    <span>Join Meeting</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Organizer */}
            {event.organizer && (
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Organizer</p>
                  <p className="text-slate-600">{event.organizer.emailAddress.name}</p>
                  <p className="text-slate-400 text-sm">{event.organizer.emailAddress.address}</p>
                </div>
              </div>
            )}

            {/* Attendees */}
            {event.attendees && event.attendees.length > 0 && (
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Attendees ({event.attendees.length})</p>
                  <div className="space-y-1 mt-1">
                    {event.attendees.slice(0, 5).map((attendee, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <span className="text-slate-600 text-sm">{attendee.emailAddress.name}</span>
                        {attendee.status.response === 'accepted' && (
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                        )}
                        {attendee.status.response === 'declined' && (
                          <X className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                    ))}
                    {event.attendees.length > 5 && (
                      <p className="text-slate-400 text-sm">+{event.attendees.length - 5} more</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Body Preview */}
            {event.bodyPreview && (
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-600 line-clamp-3">{event.bodyPreview}</p>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center space-x-2">
              {event.showAs && (
                <span className={`text-xs font-medium px-2 py-1 rounded ${getShowAsColor()}`}>
                  Show as: {event.showAs}
                </span>
              )}
              {event.categories && event.categories.length > 0 && (
                event.categories.map((cat, idx) => (
                  <span key={idx} className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-600">
                    {cat}
                  </span>
                ))
              )}
            </div>

            {/* Delete Error */}
            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{deleteError}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {event.webLink && (
                <a
                  href={event.webLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in Outlook</span>
                </a>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {showDeleteConfirm ? (
                <>
                  <span className="text-sm text-slate-600 mr-2">Delete this event?</span>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm flex items-center space-x-1"
                  >
                    {isDeleting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {onDelete && isConnected && !event.id.startsWith('demo-') && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

