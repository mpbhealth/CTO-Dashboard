import { useState, useMemo } from 'react';
import { FileText, Download, Search, Calendar, User, Tag } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { ExportModal } from '../../modals/ExportModal';

interface ConciergeNote {
  staging_id: string;
  noted_at: string | null;
  member_id: string | null;
  owner: string | null;
  note_text: string | null;
  tags: string | null;
  priority: string | null;
}

export function CEOConciergeNotes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['concierge_notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('concierge_notes')
        .select('*')
        .order('noted_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data as ConciergeNote[];
    },
  });

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (searchTerm && !note.note_text?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (dateFrom && note.noted_at && note.noted_at < dateFrom) return false;
      if (dateTo && note.noted_at && note.noted_at > dateTo) return false;
      if (selectedOwner && note.owner !== selectedOwner) return false;
      if (selectedPriority && note.priority !== selectedPriority) return false;
      return true;
    });
  }, [notes, searchTerm, dateFrom, dateTo, selectedOwner, selectedPriority]);

  const owners = useMemo(
    () => Array.from(new Set(notes.map((n) => n.owner).filter(Boolean))).sort(),
    [notes]
  );

  const priorities = useMemo(
    () => Array.from(new Set(notes.map((n) => n.priority).filter(Boolean))).sort(),
    [notes]
  );

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3d97]"></div>
        </div>
      
    );
  }

  return (
    
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="text-[#1a3d97]" size={32} />
              Concierge Notes & Tracking
            </h1>
            <p className="text-gray-600 mt-1">Search and filter member interaction notes</p>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1a3d97] to-[#00A896] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Download size={18} />
            Export
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-full space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search notes by content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a3d97] focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a3d97] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a3d97] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Owner</label>
                <select
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a3d97] focus:border-transparent"
                >
                  <option value="">All Owners</option>
                  {owners.map((owner) => (
                    <option key={owner} value={owner!}>
                      {owner}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1a3d97] focus:border-transparent"
                >
                  <option value="">All Priorities</option>
                  {priorities.map((priority) => (
                    <option key={priority} value={priority!}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full space-y-4">
          {filteredNotes.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 text-lg">No notes found matching your search criteria</p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.staging_id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-[#1a3d97] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#1a3d97] to-[#00A896] flex items-center justify-center text-white font-bold">
                      {note.owner?.charAt(0).toUpperCase() || 'N'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">{note.owner || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={12} />
                        {note.noted_at ? new Date(note.noted_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                  {note.priority && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        note.priority.toLowerCase() === 'high'
                          ? 'bg-red-100 text-red-700'
                          : note.priority.toLowerCase() === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {note.priority}
                    </span>
                  )}
                </div>

                {note.member_id && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-gray-500">Member: </span>
                    <span className="text-xs text-gray-900">{note.member_id}</span>
                  </div>
                )}

                <p className="text-gray-700 leading-relaxed mb-3">{note.note_text || 'No content'}</p>

                {note.tags && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag size={14} className="text-gray-400" />
                    {note.tags.split(',').map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-indigo-50 text-indigo-500 text-xs rounded"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {filteredNotes.length > 0 && (
          <div className="text-center text-sm text-gray-500">
            Showing {filteredNotes.length} of {notes.length} notes
          </div>
        )}

      {showExportModal && (
        <ExportModal
          data={filteredNotes}
          filename="concierge_notes"
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}

