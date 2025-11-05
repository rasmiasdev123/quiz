import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Calendar, Palette, Clock, Edit2, Plus } from 'lucide-react';
import { Button, Input } from '../ui';
import { cn } from '../../lib/utils';
import { formatDate } from '../../utils/formatters';

const NOTE_COLORS = [
  { value: 'blue', label: 'Blue', bg: 'bg-blue-500', ring: 'ring-blue-500', text: 'text-blue-700' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-500', ring: 'ring-purple-500', text: 'text-purple-700' },
  { value: 'pink', label: 'Pink', bg: 'bg-pink-500', ring: 'ring-pink-500', text: 'text-pink-700' },
  { value: 'green', label: 'Green', bg: 'bg-green-500', ring: 'ring-green-500', text: 'text-green-700' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-500', ring: 'ring-orange-500', text: 'text-orange-700' },
  { value: 'red', label: 'Red', bg: 'bg-red-500', ring: 'ring-red-500', text: 'text-red-700' },
];

const NoteModal = ({ 
  isOpen, 
  onClose, 
  note, 
  selectedDate, 
  dateNotes = null, // All notes for the selected date
  onSave, 
  onDelete, 
  onNoteClick,
  loading = false 
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('blue');
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);

  const isEditMode = !!note;
  const showNotesList = !note && dateNotes && dateNotes.length > 0;

  useEffect(() => {
    if (isOpen) {
      if (note) {
        setTitle(note.title || '');
        setContent(note.content || '');
        setColor(note.color || 'blue');
        setShowForm(true);
      } else {
        setTitle('');
        setContent('');
        setColor('blue');
        setShowForm(!showNotesList);
      }
      setErrors({});
    }
  }, [isOpen, note, showNotesList]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }
    if (content.length > 5000) {
      newErrors.content = 'Content must be less than 5000 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const noteData = {
      title: title.trim(),
      content: content.trim(),
      color,
      note_date: note?.note_date ? new Date(note.note_date) : selectedDate,
    };

    onSave(noteData);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDelete();
    }
  };

  const handleNewNote = () => {
    setShowForm(true);
  };

  const displayDate = note?.note_date ? new Date(note.note_date) : selectedDate;
  const formatDateDisplay = (date) => {
    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${weekdays[date.getDay()]} ${date.getDate()}`;
  };

  const getNoteColorClass = (colorValue) => {
    const colorObj = NOTE_COLORS.find(c => c.value === colorValue) || NOTE_COLORS[0];
    return colorObj.bg;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-50"
            onClick={onClose}
          />

          {/* Modal - Google Calendar Style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-lg shadow-2xl w-full max-w-[480px] max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold',
                  getNoteColorClass(color)
                )}>
                  {displayDate.getDate()}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatDateDisplay(displayDate)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(displayDate, 'long')}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
              {showNotesList && !showForm ? (
                // Notes List View
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {dateNotes.length} {dateNotes.length === 1 ? 'Note' : 'Notes'}
                    </h3>
                    <button
                      onClick={handleNewNote}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Note
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {dateNotes.map((noteItem) => (
                      <motion.div
                        key={noteItem.$id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ backgroundColor: '#f9fafb' }}
                        onClick={() => onNoteClick && onNoteClick(noteItem)}
                        className={cn(
                          'p-3 rounded-lg border border-gray-200 cursor-pointer transition-all',
                          'hover:border-gray-300 hover:shadow-sm'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-3 h-3 rounded-full mt-1.5 flex-shrink-0',
                            getNoteColorClass(noteItem.color || 'blue')
                          )} />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">
                              {noteItem.title || '(No title)'}
                            </h4>
                            {noteItem.content && (
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {noteItem.content}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNoteClick && onNoteClick(noteItem);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                // Form View
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {/* Title Input */}
                  <div>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Add title"
                      className={cn(
                        'w-full text-lg font-medium text-gray-900 bg-transparent border-0',
                        'focus:outline-none focus:ring-0 placeholder:text-gray-400',
                        errors.title && 'text-red-600'
                      )}
                      maxLength={200}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                    )}
                  </div>

                  {/* Date/Time Display */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 py-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(displayDate, 'long')}</span>
                    <span className="text-gray-400">•</span>
                    <span>Does not repeat</span>
                  </div>

                  {/* Content */}
                  <div>
                    <textarea
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Add description"
                      className={cn(
                        'w-full px-0 py-2 text-gray-900 bg-transparent border-0 resize-none',
                        'focus:outline-none focus:ring-0 placeholder:text-gray-400',
                        'text-sm',
                        errors.content && 'text-red-600'
                      )}
                      maxLength={5000}
                    />
                    {errors.content && (
                      <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {content.length}/5000 characters
                    </p>
                  </div>

                  {/* Color Picker */}
                  <div className="pt-2 border-t border-gray-100">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                      <Palette className="w-4 h-4 text-gray-600" />
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {NOTE_COLORS.map((colorOption) => (
                        <button
                          key={colorOption.value}
                          type="button"
                          onClick={() => setColor(colorOption.value)}
                          className={cn(
                            'relative w-8 h-8 rounded-full transition-all duration-200',
                            'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2',
                            colorOption.bg,
                            color === colorOption.value
                              ? `ring-2 ${colorOption.ring} ring-offset-2 scale-110 shadow-md`
                              : 'opacity-70 hover:opacity-100'
                          )}
                          title={colorOption.label}
                        >
                          {color === colorOption.value && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </motion.div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    {isEditMode && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={handleDelete}
                        disabled={loading}
                        leftIcon={<Trash2 className="w-4 h-4" />}
                      >
                        Delete
                      </Button>
                    )}
                    <div className={cn('flex gap-2 ml-auto', !isEditMode && 'w-full')}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        disabled={loading}
                        className={!isEditMode ? 'flex-1' : ''}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        loading={loading}
                        className={!isEditMode ? 'flex-1' : ''}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NoteModal;
