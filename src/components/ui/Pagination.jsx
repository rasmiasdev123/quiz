import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  ...props
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <nav className={cn('flex items-center justify-center gap-1', className)} {...props}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500',
          currentPage === 1
            ? 'opacity-50 cursor-not-allowed text-gray-400'
            : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      {pageNumbers.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
              <MoreHorizontal className="w-4 h-4" />
            </span>
          );
        }
        
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500',
              currentPage === page
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            {page}
          </button>
        );
      })}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500',
          currentPage === totalPages
            ? 'opacity-50 cursor-not-allowed text-gray-400'
            : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </nav>
  );
};

export default Pagination;

