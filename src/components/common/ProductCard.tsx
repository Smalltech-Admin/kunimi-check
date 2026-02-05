'use client';

import { motion } from 'framer-motion';
import { Plus, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  productId: string;
  name: string;
  icon?: string;
  draftCount?: number;
  onNewCreate: (productId: string) => void;
  onViewDrafts?: (productId: string) => void;
}

export function ProductCard({
  productId,
  name,
  icon,
  draftCount = 0,
  onNewCreate,
  onViewDrafts,
}: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      {/* Product Header */}
      <div className="p-6 text-center border-b border-slate-100 dark:border-slate-700">
        {icon && (
          <span className="text-5xl block mb-3" role="img" aria-label={name}>
            {icon}
          </span>
        )}
        <h3 className="text-lg font-bold text-foreground">{name}</h3>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-3">
        {/* New Create Button */}
        <Button
          onClick={() => onNewCreate(productId)}
          className="w-full h-12 text-base bg-primary hover:bg-primary/90"
        >
          <Plus className="w-5 h-5 mr-2" />
          新規作成
        </Button>

        {/* Draft Count Badge */}
        {draftCount > 0 && onViewDrafts && (
          <Button
            variant="outline"
            onClick={() => onViewDrafts(productId)}
            className="w-full h-10 text-sm relative"
          >
            <FileEdit className="w-4 h-4 mr-2" />
            作成中のチェック表
            <span className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">
              {draftCount}
            </span>
          </Button>
        )}
      </div>
    </motion.div>
  );
}
