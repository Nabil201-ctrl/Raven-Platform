import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '../icons';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, backTo }) => {
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      {backTo !== undefined && (
        <button
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
          className="flex items-center gap-2 text-sm mb-4 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeftIcon size={18} /> Back
        </button>
      )}
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};