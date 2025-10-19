import React from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
}

function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  sortBy,
  sortOrder,
  onSort,
  className = '',
  striped = true,
  hoverable = true
}: TableProps<T>) {
  const handleSort = (key: string) => {
    if (onSort) {
      onSort(key);
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    
    return sortOrder === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-gray-600" />
      : <ChevronDown className="w-4 h-4 text-gray-600" />;
  };

  const getAlignmentClass = (align?: string) => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  if (loading) {
    return (
      <div className={`overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg ${className}`}>
        <div className="bg-white">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex space-x-4">
              {columns.map((_, index) => (
                <div key={index} className="h-4 bg-gray-200 rounded animate-pulse flex-1"></div>
              ))}
            </div>
          </div>
          {[...Array(5)].map((_, index) => (
            <div key={index} className="px-6 py-4 border-b border-gray-200">
              <div className="flex space-x-4">
                {columns.map((_, colIndex) => (
                  <div key={colIndex} className="h-4 bg-gray-200 rounded animate-pulse flex-1"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg ${className}`}>
        <div className="bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${getAlignmentClass(column.align)}`}
                    style={{ width: column.width }}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${getAlignmentClass(column.align)} ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                }`}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key as string)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.header}</span>
                  {column.sortable && getSortIcon(column.key as string)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`bg-white divide-y divide-gray-200 ${striped ? 'divide-y divide-gray-200' : ''}`}>
          {data.map((row, rowIndex) => (
            <motion.tr
              key={rowIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: rowIndex * 0.05 }}
              className={`${striped && rowIndex % 2 === 1 ? 'bg-gray-50' : ''} ${
                hoverable ? 'hover:bg-gray-100 transition-colors duration-150' : ''
              }`}
            >
              {columns.map((column, colIndex) => {
                const value = row[column.key as keyof T];
                const cellContent = column.render 
                  ? column.render(value, row, rowIndex)
                  : value?.toString() || '';

                return (
                  <td
                    key={colIndex}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${getAlignmentClass(column.align)}`}
                  >
                    {cellContent}
                  </td>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;



