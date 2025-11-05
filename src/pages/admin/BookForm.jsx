import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';
import { bookSchema } from '../../utils/validators';
import { createBook, updateBook, getBook } from '../../services/bookService';
import { useUIStore } from '../../stores';
import { useAuthStore } from '../../stores';
import { ROUTES } from '../../utils/constants';

function BookForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);
  const user = useAuthStore((state) => state.user);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(bookSchema),
  });

  useEffect(() => {
    if (isEdit) {
      loadBook();
    }
  }, [id]);

  const loadBook = async () => {
    try {
      setLoading(true);
      const book = await getBook(id);
      if (book) {
        reset({
          title: book.title,
          description: book.description || '',
        });
      }
    } catch (error) {
      console.error('Error loading book:', error);
      showError('Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (isEdit) {
        await updateBook(id, data);
        showSuccess('Book updated successfully');
      } else {
        if (!user?.$id) {
          showError('User not authenticated. Please log in again.');
          return;
        }
        await createBook(data, user.$id);
        showSuccess('Book created successfully');
      }
      navigate(ROUTES.ADMIN.BOOKS);
    } catch (error) {
      console.error('Error saving book:', error);
      showError(error.message || 'Failed to save book');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={ROUTES.ADMIN.BOOKS}>
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Book' : 'Create New Book'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update book information' : 'Add a new book to your collection'}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Book Title"
            placeholder="Enter book title"
            error={errors.title?.message}
            {...register('title')}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              placeholder="Enter book description (optional)"
              className="w-full px-4 py-2.5 text-gray-900 bg-white border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 border-gray-300 hover:border-gray-400"
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1.5 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Link to={ROUTES.ADMIN.BOOKS}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" loading={loading} leftIcon={<Save className="w-5 h-5" />}>
              {isEdit ? 'Update Book' : 'Create Book'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default BookForm;

