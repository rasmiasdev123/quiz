import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, X, Clock } from 'lucide-react';
import { Card, Spinner } from '../../components/ui';
import { useAuthStore } from '../../stores';
import { useUIStore } from '../../stores';
import { cn } from '../../lib/utils';
import { 
  createNote, 
  getNotesByDateRange, 
  updateNote, 
  deleteNote,
  getNotesByDate 
} from '../../services/calendarNotesService';
import NoteModal from '../../components/student/NoteModal';
import { formatDate } from '../../utils/formatters';

// Custom calendar styles
import './Calendar.css';

function StudentCalendar() {
  const { user } = useAuthStore();
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const hoverTimeoutRef = useRef(null);

  // Get notes for the current month
  const loadNotes = useCallback(async () => {
    if (!user?.$id) return;

    try {
      setLoading(true);
      
      // Get first and last day of current month
      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const fetchedNotes = await getNotesByDateRange(user.$id, startDate, endDate);
      setNotes(fetchedNotes || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      showError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [user?.$id, calendarDate, showError]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Add hover handlers to calendar tiles
  useEffect(() => {
    const handleTileMouseEnter = (e) => {
      const tile = e.target.closest('.react-calendar__tile');
      if (!tile) return;
      
      const dateStr = tile.querySelector('abbr')?.textContent;
      if (!dateStr) return;
      
      // Try to find the date from the tile
      const tiles = document.querySelectorAll('.react-calendar__tile');
      tiles.forEach((t, index) => {
        if (t === tile) {
          // Get date from calendar state
          const year = calendarDate.getFullYear();
          const month = calendarDate.getMonth();
          const firstDay = new Date(year, month, 1);
          const dayOfWeek = firstDay.getDay();
          const dayNumber = parseInt(dateStr);
          
          if (!isNaN(dayNumber)) {
            const date = new Date(year, month, dayNumber);
            const dateNotes = getNotesForDate(date);
            
            if (dateNotes.length > 0) {
              const rect = tile.getBoundingClientRect();
              setHoverPosition({
                x: rect.left + rect.width / 2,
                y: rect.top,
              });
              setHoveredDate(date);
            }
          }
        }
      });
    };

    const tiles = document.querySelectorAll('.react-calendar__tile.has-notes');
    tiles.forEach(tile => {
      tile.addEventListener('mouseenter', handleTileMouseEnter);
    });

    return () => {
      tiles.forEach(tile => {
        tile.removeEventListener('mouseenter', handleTileMouseEnter);
      });
    };
  }, [notes, calendarDate]);

  // Get notes for a specific date
  const getNotesForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return notes.filter(note => {
      const noteDate = new Date(note.note_date);
      const noteDateStr = noteDate.toISOString().split('T')[0];
      return noteDateStr === dateStr;
    });
  };

  // Handle date click - show all notes for that date
  const handleDateClick = async (date) => {
    setSelectedDate(date);
    const dateNotes = getNotesForDate(date);
    setSelectedNote(null); // Clear single note selection, show all notes
    setIsModalOpen(true);
  };

  // Handle note click from list
  const handleNoteClick = (note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  // Handle note save
  const handleSave = async (noteData) => {
    if (!user?.$id) return;

    try {
      setSaving(true);

      if (selectedNote) {
        // Update existing note
        await updateNote(selectedNote.$id, noteData);
        showSuccess('Note updated successfully');
      } else {
        // Create new note
        await createNote(user.$id, noteData);
        showSuccess('Note created successfully');
      }

      setIsModalOpen(false);
      setSelectedNote(null);
      await loadNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      showError('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  // Handle note delete
  const handleDelete = async () => {
    if (!selectedNote?.$id) return;

    try {
      setSaving(true);
      await deleteNote(selectedNote.$id);
      showSuccess('Note deleted successfully');
      setIsModalOpen(false);
      setSelectedNote(null);
      await loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      showError('Failed to delete note');
    } finally {
      setSaving(false);
    }
  };

  // Handle month change
  const handleMonthChange = (date) => {
    setCalendarDate(date);
  };

  // Get color class for note
  const getNoteColorClass = (color) => {
    const colors = {
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      pink: 'bg-pink-500',
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
    };
    return colors[color] || colors.blue;
  };

  // Handle date hover
  const handleDateHover = (date, event) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    const dateNotes = getNotesForDate(date);
    if (dateNotes.length > 0) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredDate(date);
        if (event && event.currentTarget) {
          const rect = event.currentTarget.closest('.react-calendar__tile')?.getBoundingClientRect();
          if (rect) {
            setHoverPosition({
              x: rect.left + rect.width / 2,
              y: rect.top,
            });
          }
        }
      }, 200); // Small delay for better UX
    }
  };

  const handleDateLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredDate(null);
  };

  // Custom tile content for calendar - show notes as bars
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateNotes = getNotesForDate(date);
      if (dateNotes.length > 0) {
        return (
          <div className="mt-1 space-y-0.5 w-full">
            {dateNotes.slice(0, 3).map((note) => (
              <motion.div
                key={note.$id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'text-xs px-2 py-0.5 rounded truncate text-white font-medium cursor-pointer hover:opacity-90',
                  getNoteColorClass(note.color || 'blue')
                )}
                title={note.title}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNoteClick(note);
                }}
              >
                {note.title || '(No title)'}
              </motion.div>
            ))}
            {dateNotes.length > 3 && (
              <div className="text-xs text-gray-600 font-semibold px-2">
                +{dateNotes.length - 3} more
              </div>
            )}
          </div>
        );
      }
    }
    return null;
  };

  // Custom tile class name
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const today = new Date();
      const isToday = 
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
      
      const isSelected = 
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear();

      const dateNotes = getNotesForDate(date);

      return cn(
        'transition-colors relative group calendar-tile-hover',
        isToday && 'bg-blue-50',
        isSelected && 'bg-blue-100 ring-2 ring-blue-500',
        dateNotes.length > 0 && 'has-notes'
      );
    }
    return null;
  };

  // Format date for display
  const formatDateDisplay = (date) => {
    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${weekdays[date.getDay()]} ${date.getDate()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const hoveredDateNotes = hoveredDate ? getNotesForDate(hoveredDate) : [];

  return (
    <div className="space-y-4">
      {/* Header - Google Calendar Style */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-normal text-gray-900">Calendar</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCalendarDate(new Date())}
              className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center">
              <button
                onClick={() => {
                  const newDate = new Date(calendarDate);
                  newDate.setFullYear(newDate.getFullYear() - 1);
                  setCalendarDate(newDate);
                }}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Previous year"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => {
                  const newDate = new Date(calendarDate);
                  newDate.setFullYear(newDate.getFullYear() + 1);
                  setCalendarDate(newDate);
                }}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Next year"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <span className="text-xl font-normal text-gray-900 min-w-[140px]">
              {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setSelectedDate(new Date());
            setSelectedNote(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">Create</span>
        </motion.button>
      </div>

      {/* Calendar Card - Google Calendar Style */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-0 border border-gray-200 overflow-hidden bg-white">
          <div className="relative">
            <div
              onMouseLeave={handleDateLeave}
            >
              <Calendar
                onChange={handleDateClick}
                value={selectedDate}
                activeStartDate={calendarDate}
                onActiveStartDateChange={({ activeStartDate }) => {
                  if (activeStartDate) {
                    handleMonthChange(activeStartDate);
                  }
                }}
                tileContent={tileContent}
                tileClassName={tileClassName}
                className="custom-calendar google-style"
                nextLabel={<ChevronRight className="w-5 h-5" />}
                prevLabel={<ChevronLeft className="w-5 h-5" />}
                next2Label={null}
                prev2Label={null}
                formatShortWeekday={(locale, date) => {
                  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                  return weekdays[date.getDay()];
                }}
              />
            </div>

            {/* Hover Tooltip */}
            <AnimatePresence>
              {hoveredDate && hoveredDateNotes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-[200px] max-w-[300px] pointer-events-auto"
                  style={{
                    left: `${hoverPosition.x}px`,
                    top: `${hoverPosition.y - 10}px`,
                    transform: 'translateX(-50%) translateY(-100%)',
                  }}
                  onMouseEnter={() => setHoveredDate(hoveredDate)}
                  onMouseLeave={handleDateLeave}
                >
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    {formatDateDisplay(hoveredDate)}
                  </div>
                  <div className="space-y-1.5">
                    {hoveredDateNotes.slice(0, 5).map((note) => (
                      <div
                        key={note.$id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', getNoteColorClass(note.color || 'blue'))} />
                        <span className="text-gray-800 truncate">{note.title || '(No title)'}</span>
                      </div>
                    ))}
                    {hoveredDateNotes.length > 5 && (
                      <div className="text-xs text-gray-500 pt-1">
                        +{hoveredDateNotes.length - 5} more
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>

      {/* Note Modal */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNote(null);
        }}
        note={selectedNote}
        selectedDate={selectedDate}
        calendarDate={calendarDate}
        dateNotes={selectedNote ? null : getNotesForDate(selectedDate)}
        onSave={handleSave}
        onDelete={handleDelete}
        onNoteClick={handleNoteClick}
        loading={saving}
      />
    </div>
  );
}

export default StudentCalendar;
