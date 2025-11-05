import { cn } from '../../lib/utils.js';

const Table = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className={cn('w-full', className)} {...props}>
        {children}
      </table>
    </div>
  );
};

const TableHeader = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <thead className={cn('bg-gray-50 border-b border-gray-200', className)} {...props}>
      {children}
    </thead>
  );
};

const TableBody = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tbody className={cn('bg-white divide-y divide-gray-200', className)} {...props}>
      {children}
    </tbody>
  );
};

const TableRow = ({
  children,
  className = '',
  hover = false,
  ...props
}) => {
  return (
    <tr
      className={cn(
        'transition-colors',
        hover && 'hover:bg-gray-50 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
};

const TableHead = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
};

const TableCell = ({
  children,
  className = '',
  wrap = false,
  ...props
}) => {
  return (
    <td
      className={cn(
        'px-4 py-3 text-sm text-gray-900',
        wrap ? 'whitespace-normal' : 'whitespace-nowrap',
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
};

Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Head = TableHead;
Table.Cell = TableCell;

export default Table;

