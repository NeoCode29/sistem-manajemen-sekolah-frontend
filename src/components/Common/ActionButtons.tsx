import React from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';

export interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onEdit, onDelete, onView }) => {
  return (
    <div className="flex items-center gap-2">
      {onView && (
        <button 
          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          onClick={onView}
          title="Detail"
        >
          <Eye size={18} />
        </button>
      )}
      {onEdit && (
        <button 
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          onClick={onEdit}
          title="Edit"
        >
          <Edit size={18} />
        </button>
      )}
      {onDelete && (
        <button 
          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          onClick={onDelete}
          title="Hapus"
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );
};
