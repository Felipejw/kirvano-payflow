import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Package, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
}

interface ProductFilterProps {
  selectedProducts: string[];
  onProductsChange: (productIds: string[]) => void;
}

export function ProductFilter({ selectedProducts, onProductsChange }: ProductFilterProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('products')
        .select('id, name')
        .eq('seller_id', user.id)
        .eq('status', 'active')
        .order('name');

      setProducts(data || []);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const toggleProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      onProductsChange(selectedProducts.filter(id => id !== productId));
    } else {
      onProductsChange([...selectedProducts, productId]);
    }
  };

  const clearSelection = () => {
    onProductsChange([]);
    setOpen(false);
  };

  const selectAll = () => {
    onProductsChange(products.map(p => p.id));
  };

  const getButtonLabel = () => {
    if (selectedProducts.length === 0) {
      return 'Todos os produtos';
    }
    if (selectedProducts.length === 1) {
      const product = products.find(p => p.id === selectedProducts[0]);
      return product?.name || 'Produto selecionado';
    }
    return `${selectedProducts.length} produtos`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between min-w-[160px] max-w-[200px]"
          disabled={loading}
        >
          <div className="flex items-center gap-2 truncate">
            <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm">{getButtonLabel()}</span>
          </div>
          <div className="flex items-center gap-1">
            {selectedProducts.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {selectedProducts.length}
              </Badge>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar produto..." />
          <CommandList>
            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            <CommandGroup>
              <div className="flex items-center justify-between px-2 py-1.5 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={selectAll}
                >
                  Selecionar todos
                </Button>
                {selectedProducts.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={clearSelection}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => toggleProduct(product.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedProducts.includes(product.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{product.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
