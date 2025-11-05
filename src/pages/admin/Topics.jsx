import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, FolderTree, Filter, Copy, Check } from 'lucide-react';
import { Button, Card, Input, Modal, Spinner } from '../../components/ui';
import NativeSelect from '../../components/ui/NativeSelect';
import { ROUTES } from '../../utils/constants';
import { getTopics, deleteTopic } from '../../services/topicService';
import { getAdminTopicsData } from '../../services/adminTopicsService';
import { useUIStore } from '../../stores';
import { formatDate } from '../../utils/formatters';

function Topics() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, topic: null });
  const [copiedTopicId, setCopiedTopicId] = useState(null);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);

  useEffect(() => {
    loadData();
  }, [selectedBook]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Single optimized call to get both topics and books in parallel
      const { topics: topicsList, books: booksList } = await getAdminTopicsData({
        bookId: selectedBook || undefined,
        limit: 100,
      });
      setTopics(topicsList);
      setBooks(booksList);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.topic) return;
    try {
      await deleteTopic(deleteModal.topic.$id);
      showSuccess('Topic deleted successfully');
      setDeleteModal({ open: false, topic: null });
      loadData();
    } catch (error) {
      console.error('Error deleting topic:', error);
      showError('Failed to delete topic');
    }
  };

  const handleCopyTopicId = async (topicId, e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(topicId);
      setCopiedTopicId(topicId);
      showSuccess('Topic ID copied!', { duration: 2000 });
      setTimeout(() => {
        setCopiedTopicId(null);
      }, 2000);
    } catch (error) {
      console.error('Error copying topic ID:', error);
      showError('Failed to copy topic ID');
    }
  };

  const filteredTopics = topics.filter((topic) =>
    topic.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedBookName = books.find((b) => b.$id === selectedBook)?.title || 'All Books';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Topics</h1>
          <p className="text-gray-600 mt-1">Manage topics by book</p>
        </div>
        <Link to={`${ROUTES.ADMIN.TOPICS}/new`}>
          <Button variant="primary" leftIcon={<Plus className="w-5 h-5" />}>
            Add New Topic
          </Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <NativeSelect
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            containerClassName="w-full sm:w-64"
          >
            <option value="">All Books</option>
            {books.map((book) => (
              <option key={book.$id} value={book.$id}>
                {book.title}
              </option>
            ))}
          </NativeSelect>
        </div>
      </Card>

      {filteredTopics.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderTree className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No topics found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedBook ? 'Try adjusting your filters' : 'Get started by creating your first topic'}
          </p>
          {!searchTerm && !selectedBook && (
            <Link to={`${ROUTES.ADMIN.TOPICS}/new`}>
              <Button variant="primary" leftIcon={<Plus className="w-5 h-5" />}>
                Create First Topic
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTopics.map((topic, index) => {
            // Cycle through different accent colors for visual variety
            const accentColors = [
              { bg: 'bg-green-50', icon: 'bg-green-500', border: 'border-green-200', text: 'text-green-700' },
              { bg: 'bg-emerald-50', icon: 'bg-emerald-500', border: 'border-emerald-200', text: 'text-emerald-700' },
              { bg: 'bg-teal-50', icon: 'bg-teal-500', border: 'border-teal-200', text: 'text-teal-700' },
              { bg: 'bg-cyan-50', icon: 'bg-cyan-500', border: 'border-cyan-200', text: 'text-cyan-700' },
            ];
            const colorScheme = accentColors[index % accentColors.length];
            
            return (
              <Card 
                key={topic.$id} 
                variant="elevated" 
                hover 
                className="p-0 overflow-hidden border border-gray-200 hover:border-gray-300 transition-all duration-300 group"
              >
                {/* Header Section with Icon */}
                <div className={`${colorScheme.bg} p-4 border-b ${colorScheme.border} relative overflow-hidden`}>
                  {/* Decorative Pattern */}
                  <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                    <div className="absolute top-2 right-2 w-16 h-16 border-2 border-gray-400 rounded-full"></div>
                    <div className="absolute top-4 right-4 w-10 h-10 border-2 border-gray-400 rounded-full"></div>
                  </div>
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className={`${colorScheme.icon} w-10 h-10 rounded-xl flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-300`}>
                      <FolderTree className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${ROUTES.ADMIN.TOPICS}/${topic.$id}/edit`);
                        }}
                        className="p-1.5 bg-white/80 backdrop-blur-sm hover:bg-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <Edit className="w-3.5 h-3.5 text-gray-700" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({ open: true, topic });
                        }}
                        className="p-1.5 bg-white/80 backdrop-blur-sm hover:bg-red-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-gray-700 transition-colors flex-1">
                      {topic.title}
                    </h3>
                    <button
                      onClick={(e) => handleCopyTopicId(topic.$id, e)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 flex-shrink-0"
                      title="Copy Topic ID"
                    >
                      {copiedTopicId === topic.$id ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </button>
                  </div>
                  <p className="text-gray-600 text-xs mb-4 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                    {topic.description || 'No description provided'}
                  </p>
                  
                  {/* Footer with Date */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                      <span className="text-[10px]">{formatDate(topic.$createdAt)}</span>
                    </div>
                    <div className={`${colorScheme.text} text-[10px] font-medium px-2 py-0.5 rounded ${colorScheme.bg} border ${colorScheme.border}`}>
                      Topic
                    </div>
                  </div>
                </div>

                {/* Hover Effect Indicator */}
                <div className={`h-0.5 ${colorScheme.icon} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, topic: null })}
        title="Delete Topic"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{deleteModal.topic?.title}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteModal({ open: false, topic: null })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Topics;

