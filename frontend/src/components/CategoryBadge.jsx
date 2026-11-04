import React from 'react';
import {
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  File,
} from 'lucide-react';

const CATEGORY_CONFIG = {
  Documents: {
    icon: FileText,
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.25)',
  },
  Images: {
    icon: Image,
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.25)',
  },
  Videos: {
    icon: Video,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.25)',
  },
  Audio: {
    icon: Music,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  Archives: {
    icon: Archive,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.25)',
  },
  Code: {
    icon: Code,
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.25)',
  },
  Others: {
    icon: File,
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.25)',
  },
};

export default function CategoryBadge({ category, size = 'md' }) {
  const conf = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.Others;
  const IconComponent = conf.icon;

  const isSmall = size === 'sm';

  return (
    <span
      className="category-badge"
      style={{
        backgroundColor: conf.bg,
        borderColor: conf.border,
        color: conf.color,
        fontSize: isSmall ? '0.7rem' : '0.78rem',
        padding: isSmall ? '2px 8px' : '4px 10px',
      }}
    >
      <IconComponent size={isSmall ? 12 : 14} />
      <span>{category}</span>
    </span>
  );
}
