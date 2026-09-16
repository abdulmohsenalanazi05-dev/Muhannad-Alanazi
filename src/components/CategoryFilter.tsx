import React from 'react';
import { CategoryId, Category } from '../types';
import { CATEGORIES } from '../data/games';
import { soundEngine } from '../utils/audio';

interface CategoryFilterProps {
  selectedCategory: CategoryId;
  onSelectCategory: (catId: CategoryId) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-white font-display flex items-center justify-center gap-2">
          <span>وش جوّ جمعتكم؟</span>
          <span className="text-amber-400">🔥</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          حدد المود واكتشف اللعبة الأنسب لجلستكم الليلة
        </p>
      </div>

      {/* Category Pills Slider / Flex */}
      <div className="flex items-center justify-start sm:justify-center gap-2.5 overflow-x-auto pb-2 px-2 no-scrollbar">
        {CATEGORIES.map((cat: Category) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              id={`cat-filter-${cat.id}`}
              onClick={() => {
                soundEngine.playClick();
                onSelectCategory(cat.id);
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800/80'
              }`}
            >
              <span className="text-base">{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
