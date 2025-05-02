"use client"

import { cn } from "@/lib/utils"
import React from "react"

interface CategoryFilterProps {
  categories: string[]
  selectedCategory: string | null
  onCategorySelect: (category: string | null) => void
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategorySelect,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        className={cn(
          "px-3 py-1 text-sm rounded-full transition-colors",
          selectedCategory === null
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-muted/80 text-muted-foreground"
        )}
        onClick={() => onCategorySelect(null)}
      >
        Tutti
      </button>
      
      {categories.map((category) => (
        <button
          key={category}
          className={cn(
            "px-3 py-1 text-sm rounded-full transition-colors",
            selectedCategory === category
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          )}
          onClick={() => onCategorySelect(category)}
        >
          {category}
        </button>
      ))}
    </div>
  )
} 