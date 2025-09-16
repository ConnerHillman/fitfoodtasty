import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Check, X } from 'lucide-react';
import type { IngredientLineItem } from '@/types/kitchen';

interface IngredientFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: IngredientLineItem[];
  selectedIngredients: Set<string>;
  onApply: (selected: Set<string>) => void;
}

export const IngredientFilterModal: React.FC<IngredientFilterModalProps> = ({
  isOpen,
  onClose,
  ingredients,
  selectedIngredients,
  onApply
}) => {
  const [localSelected, setLocalSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSelected(new Set(selectedIngredients));
      setSearchQuery('');
    }
  }, [isOpen, selectedIngredients]);

  // Filter ingredients based on search query
  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.ingredientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleIngredient = (ingredientName: string) => {
    const newSelected = new Set(localSelected);
    if (newSelected.has(ingredientName)) {
      newSelected.delete(ingredientName);
    } else {
      newSelected.add(ingredientName);
    }
    setLocalSelected(newSelected);
  };

  const handleSelectAll = () => {
    const allIngredientNames = new Set(filteredIngredients.map(ing => ing.ingredientName));
    setLocalSelected(allIngredientNames);
  };

  const handleClearAll = () => {
    setLocalSelected(new Set());
  };

  const handleApply = () => {
    onApply(localSelected);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const selectedCount = localSelected.size;
  const totalCount = ingredients.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Filter Ingredients</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select which ingredients to include in reports
          </p>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>

          {/* Selection Count */}
          <div className="text-sm text-muted-foreground text-center">
            {selectedCount} of {totalCount} ingredients selected
          </div>

          {/* Ingredients List */}
          <ScrollArea className="flex-1 border rounded-md">
            <div className="p-4 space-y-3">
              {filteredIngredients.length > 0 ? (
                filteredIngredients.map((ingredient, ingredientIndex) => {
                  const isSelected = localSelected.has(ingredient.ingredientName);
                  return (
                    <div
                      key={ingredient.ingredientName}
                      className="flex items-center space-x-3 hover:bg-muted/50 p-2 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      onClick={() => handleToggleIngredient(ingredient.ingredientName)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleIngredient(ingredient.ingredientName);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-pressed={isSelected}
                      aria-label={`${isSelected ? 'Deselect' : 'Select'} ${ingredient.ingredientName}, ${ingredient.totalQuantity}${ingredient.unit}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleIngredient(ingredient.ingredientName)}
                        tabIndex={-1}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {ingredient.ingredientName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {ingredient.totalQuantity}{ingredient.unit}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No ingredients found matching "{searchQuery}"
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply Filter ({selectedCount} selected)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};