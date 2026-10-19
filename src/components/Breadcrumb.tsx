import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-4 overflow-x-auto py-1">
      <button
        onClick={items[0]?.onClick}
        className="flex items-center hover:text-blue-600 transition shrink-0"
      >
        <Home className="w-3.5 h-3.5 mr-1 text-slate-400" />
        <span>หน้าหลัก</span>
      </button>

      {items.slice(1).map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          {item.active || !item.onClick ? (
            <span className="font-semibold text-slate-800 shrink-0 truncate max-w-[200px]">
              {item.label}
            </span>
          ) : (
            <button
              onClick={item.onClick}
              className="hover:text-blue-600 transition shrink-0 truncate max-w-[150px]"
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
