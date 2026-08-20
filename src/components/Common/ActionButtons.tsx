import React from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';

export interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onEdit, onDelete, onView }) => {
  return (
    <div className="action-buttons-group">
      {onView && (
        <button 
          className="action-btn action-btn-view"
          onClick={onView}
          title="Detail"
        >
          <Eye size={18} />
        </button>
      )}
      {onEdit && (
        <button 
          className="action-btn action-btn-edit"
          onClick={onEdit}
          title="Edit"
        >
          <Edit size={18} />
        </button>
      )}
      {onDelete && (
        <button 
          className="action-btn action-btn-delete"
          onClick={onDelete}
          title="Hapus"
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );
};
