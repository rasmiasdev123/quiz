import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, BookOpen, Filter, Copy, Check } from 'lucide-react';
import { Button, Card, Input, Table, Badge, Modal, Spinner } from '../../components/ui';
import { ROUTES } from '../../utils/constants';
import { getBooks, deleteBook } from '../../services/bookService';
import { getAdminBooksData } from '../../services/adminBooksService';
import { useUIStore } from '../../stores';
import { formatDate } from '../../utils/formatters';

function Books() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, book: null });
  const [copiedBookId, setCopiedBookId] = useState(null);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      // Use optimized service with proper limit
      const { books: booksList } = await getAdminBooksData({ limit: 100 });
      setBooks(booksList);
    } catch (error) {
      console.error('Error loading books:', error);
      showError('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.book) return;

    try {
      await deleteBook(deleteModal.book.$id);
      showSuccess('Book deleted successfully');
      setDeleteModal({ open: false, book: null });
      loadBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      showError('Failed to delete book');
    }
  };

  const handleCopyBookId = async (bookId, e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(bookId);
      setCopiedBookId(bookId);
      showSuccess('Book ID copied!', { duration: 2000 });
      setTimeout(() => {
        setCopiedBookId(null);
      }, 2000);
    } catch (error) {
      console.error('Error copying book ID:', error);
      showError('Failed to copy book ID');
    }
  };

  const filteredBooks = books.filter((book) =>
    book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Books</h1>
          <p className="text-gray-600 mt-1">Manage your book collection</p>
        </div>
        <Link to={`${ROUTES.ADMIN.BOOKS}/new`}>
          <Button variant="primary" leftIcon={<Plus className="w-5 h-5" />}>
            Add New Book
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No books found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? 'Try adjusting your search' : 'Get started by creating your first book'}
          </p>
          {!searchTerm && (
            <Link to={`${ROUTES.ADMIN.BOOKS}/new`}>
              <Button variant="primary" leftIcon={<Plus className="w-5 h-5" />}>
                Create First Book
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBooks.map((book, index) => {
            // Cycle through different accent colors for visual variety
            const accentColors = [
              { bg: 'bg-blue-50', icon: 'bg-blue-500', border: 'border-blue-200', text: 'text-blue-700' },
              { bg: 'bg-purple-50', icon: 'bg-purple-500', border: 'border-purple-200', text: 'text-purple-700' },
              { bg: 'bg-emerald-50', icon: 'bg-emerald-500', border: 'border-emerald-200', text: 'text-emerald-700' },
              { bg: 'bg-amber-50', icon: 'bg-amber-500', border: 'border-amber-200', text: 'text-amber-700' },
              { bg: 'bg-rose-50', icon: 'bg-rose-500', border: 'border-rose-200', text: 'text-rose-700' },
              { bg: 'bg-indigo-50', icon: 'bg-indigo-500', border: 'border-indigo-200', text: 'text-indigo-700' },
            ];
            const colorScheme = accentColors[index % accentColors.length];
            
            return (
              <Card 
                key={book.$id} 
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
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${ROUTES.ADMIN.BOOKS}/${book.$id}/edit`);
                        }}
                        className="p-1.5 bg-white/80 backdrop-blur-sm hover:bg-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <Edit className="w-3.5 h-3.5 text-gray-700" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({ open: true, book });
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
                      {book.title}
                    </h3>
                    <button
                      onClick={(e) => handleCopyBookId(book.$id, e)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 flex-shrink-0"
                      title="Copy Book ID"
                    >
                      {copiedBookId === book.$id ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </button>
                  </div>
                  <p className="text-gray-600 text-xs mb-4 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                    {book.description || 'No description provided'}
                  </p>
                  
                  {/* Footer with Date */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                      <span className="text-[10px]">{formatDate(book.$createdAt)}</span>
                    </div>
                    <div className={`${colorScheme.text} text-[10px] font-medium px-2 py-0.5 rounded ${colorScheme.bg} border ${colorScheme.border}`}>
                      Book
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, book: null })}
        title="Delete Book"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{deleteModal.book?.title}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, book: null })}
            >
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

export default Books;

