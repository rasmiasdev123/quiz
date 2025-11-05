import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';
import NativeSelect from '../../components/ui/NativeSelect';
import { topicSchema } from '../../utils/validators';
import { createTopic, updateTopic, getTopic } from '../../services/topicService';
import { getBooksForDropdown } from '../../services/bookService';
import { useUIStore } from '../../stores';
import { useAuthStore } from '../../stores';
import { ROUTES } from '../../utils/constants';

function TopicForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [books, setBooks] = useState([]);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);
  const user = useAuthStore((state) => state.user);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      order: 0,
    },
  });

  const selectedBook = watch('book_id');

  useEffect(() => {
    loadBooks();
    if (isEdit) {
      loadTopic();
    }
  }, [id]);

  const loadBooks = async () => {
    try {
      // Use optimized function for dropdown - only fetches id and title
      const booksList = await getBooksForDropdown();
      setBooks(booksList);
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  const loadTopic = async () => {
    try {
      setLoading(true);
      const topic = await getTopic(id);
      if (topic) {
        reset({
          book_id: topic.book_id,
          title: topic.title,
          description: topic.description || '',
          order: topic.order || 0,
        });
      }
    } catch (error) {
      console.error('Error loading topic:', error);
      showError('Failed to load topic');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (isEdit) {
        await updateTopic(id, data);
        showSuccess('Topic updated successfully');
      } else {
        if (!user?.$id) {
          showError('User not authenticated. Please log in again.');
          return;
        }
        await createTopic(data, user.$id);
        showSuccess('Topic created successfully');
      }
      navigate(ROUTES.ADMIN.TOPICS);
    } catch (error) {
      console.error('Error saving topic:', error);
      showError(error.message || 'Failed to save topic');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to={ROUTES.ADMIN.TOPICS}>
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Topic' : 'Create New Topic'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update topic information' : 'Add a new topic to a book'}
          </p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Book <span className="text-red-500">*</span>
            </label>
            <NativeSelect
              {...register('book_id')}
              value={selectedBook}
              error={errors.book_id?.message}
              required
            >
              <option value="">Select a book</option>
              {books.map((book) => (
                <option key={book.$id} value={book.$id}>
                  {book.title}
                </option>
              ))}
            </NativeSelect>
            {errors.book_id && (
              <p className="mt-1.5 text-sm text-red-600">{errors.book_id.message}</p>
            )}
          </div>

          <Input
            label="Topic Title"
            placeholder="Enter topic title"
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
              placeholder="Enter topic description (optional)"
              className="w-full px-4 py-2.5 text-gray-900 bg-white border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 border-gray-300 hover:border-gray-400"
              {...register('description')}
            />
          </div>

          <Input
            label="Order"
            type="number"
            placeholder="0"
            error={errors.order?.message}
            {...register('order', { valueAsNumber: true })}
          />

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Link to={ROUTES.ADMIN.TOPICS}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" loading={loading} leftIcon={<Save className="w-5 h-5" />}>
              {isEdit ? 'Update Topic' : 'Create Topic'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default TopicForm;

