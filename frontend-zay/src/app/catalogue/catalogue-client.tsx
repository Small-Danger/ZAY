"use client"

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { isProductFullyOutOfStock, sizeStockMap } from '@/lib/product-stock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  Camera, 
  ChevronRight, 
  Sparkles, 
  Moon, 
  Palmtree, 
  GraduationCap,
  ArrowLeft,
  SlidersHorizontal,
  X,
  LayoutGrid,
  Grid2X2,
  Loader2,
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProducts } from '@/hooks/use-products';
import { useCategories } from '@/hooks/use-categories';
import { resolveMediaUrl } from '@/lib/api';
import type { ApiCategory, UiProduct } from '@/lib/api';
import { MediaImage } from '@/components/ui/media-image';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const RingIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="15" r="6" />
    <path d="M9 7l3-4 3 4-3 2-3-2z" />
  </svg>
);

/** Moments → catégorie catalogue (filtre réel à la sélection) */
const OCCASIONS = [
  { icon: Sparkles, label: 'Mariages', category: 'ROBES', sub: 'Robes de soirée' },
  { icon: GraduationCap, label: 'Bal', category: 'ROBES', sub: null },
  { icon: RingIcon, label: 'Occasions', category: 'ROBES', sub: null },
  { icon: Moon, label: 'Soirées', category: 'ROBES', sub: 'Robes de soirée' },
  { icon: Palmtree, label: 'Vacances', category: 'ENSEMBLES', sub: null },
];

const FALLBACK_IMAGES: Record<string, string> = {
  ROBES: '/robes.png',
  JUPES: '/jupes.png',
  ENSEMBLES: '/ensembles.png',
  TAILLEURS: '/ensembles-tailleurs.png',
  'TOPS & CHEMISES': '/tops.png',
  ACCESSOIRES: '/accessoires.png',
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const COLORS = [
  { name: 'Noir', hex: '#000000' },
  { name: 'Blanc', hex: '#FFFFFF' },
  { name: 'Rose ZAY', hex: '#D4537E' },
  { name: 'Nude', hex: '#C4927A' },
  { name: 'Sable', hex: '#E8DDD6' },
  { name: 'Or', hex: '#D4AF37' }
];

export function CatalogueClient({
  initialProducts,
  initialCategories,
}: {
  initialProducts: UiProduct[];
  initialCategories: ApiCategory[];
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="animate-spin text-primary" />
        </div>
      }
    >
      <CataloguePageInner
        initialProducts={initialProducts}
        initialCategories={initialCategories}
      />
    </Suspense>
  );
}

function CataloguePageInner({
  initialProducts,
  initialCategories,
}: {
  initialProducts: UiProduct[];
  initialCategories: ApiCategory[];
}) {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [showSearchMenu, setShowSearchMenu] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [onlyNew, setOnlyNew] = useState(false);
  const [sortBy, setSortBy] = useState<'new' | 'price-asc' | 'price-desc' | 'popular'>('new');
  
  const { data: products, loading } = useProducts({}, initialProducts);
  const { data: categories, loading: loadingCats } = useCategories(initialCategories);

  const filterStructure = useMemo(() => {
    if (categories.length === 0) return [];
    return categories
      .filter((cat) => !/test|auth\s*test/i.test(cat.name))
      .map((cat) => ({
        label: cat.name.toUpperCase(),
        image: resolveMediaUrl(cat.image, FALLBACK_IMAGES[cat.name.toUpperCase()] || '/robes.png'),
        subCategories: [
          'Voir tout',
          ...(cat.subcategories || []).map((s) => s.name),
        ],
      }));
  }, [categories]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat?.trim()) {
      setSelectedCategory(cat.trim().toUpperCase());
      setSelectedSubCategory(null);
    }
    const n = (searchParams.get('new') || '').toLowerCase();
    if (n === 'true' || n === '1') {
      setOnlyNew(true);
      setSortBy('new');
    }
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    const list = (products || []).filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.subcategoryName || '').toLowerCase().includes(q);
      const matchCategory = !selectedCategory || p.category.toUpperCase() === selectedCategory;
      const matchSubCategory =
        !selectedSubCategory ||
        (p.subcategoryName || '').toLowerCase() === selectedSubCategory.toLowerCase();
      const matchSize =
        !selectedSize || p.sizes.length === 0 || p.sizes.includes(selectedSize);
      const matchColor =
        !selectedColor ||
        p.colors.length === 0 ||
        p.colors.some((c) => c.name === selectedColor);
      const matchPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      const matchNew = !onlyNew || p.isNew;
      return (
        matchSearch &&
        matchCategory &&
        matchSubCategory &&
        matchSize &&
        matchColor &&
        matchPrice &&
        matchNew
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'popular') {
        if (a.isPromo !== b.isPromo) return a.isPromo ? -1 : 1;
        if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
        return a.name.localeCompare(b.name, 'fr');
      }
      if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
      return a.name.localeCompare(b.name, 'fr');
    });
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedSubCategory,
    selectedSize,
    selectedColor,
    priceRange,
    onlyNew,
    sortBy,
  ]);

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setSelectedSize(null);
    setSelectedColor(null);
    setPriceRange([0, 500]);
    setSearchQuery('');
    setSearchDraft('');
    setOnlyNew(false);
  };

  const applySearchAndClose = (query?: string) => {
    const next = (query ?? searchDraft).trim();
    setSearchQuery(next);
    setSearchDraft(next);
    setShowSearchMenu(false);
  };

  const applyCategoryAndClose = (label: string, sub: string | null = null) => {
    setSelectedCategory(label);
    setSelectedSubCategory(sub);
    setShowSearchMenu(false);
  };

  const selectCategoryBubble = (label: string) => {
    const next = selectedCategory === label ? null : label;
    setSelectedCategory(next);
    setSelectedSubCategory(null);
  };

  const FiltersContent = () => (
    <div className="space-y-10">
      <section className="space-y-6">
        <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zay-text-muted">CATÉGORIES</h4>
        {loadingCats && filterStructure.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary" size={20} />
          </div>
        ) : filterStructure.length === 0 ? (
          <p className="text-[10px] italic text-zay-text-muted">Aucune catégorie.</p>
        ) : (
          <div className="space-y-6">
            {filterStructure.map((group) => (
              <div key={group.label} className="space-y-3">
                <button 
                  type="button"
                  onClick={() => setSelectedCategory(selectedCategory === group.label ? null : group.label)}
                  className={cn(
                    "flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase transition-all",
                    selectedCategory === group.label ? "text-primary" : "text-zay-text"
                  )}
                >
                  <div className={cn(
                    "w-3.5 h-3.5 border border-zay-border flex items-center justify-center transition-colors",
                    selectedCategory === group.label && "bg-primary border-primary"
                  )}>
                    {selectedCategory === group.label && <X size={10} className="text-white" />}
                  </div>
                  {group.label}
                </button>
                
                <div className="pl-6 space-y-2">
                  {group.subCategories.map(sub => (
                    <button
                      type="button"
                      key={sub}
                      onClick={() => {
                        if (sub === 'Voir tout') {
                          setSelectedSubCategory(null);
                          setSelectedCategory(group.label);
                        } else {
                          setSelectedCategory(group.label);
                          setSelectedSubCategory(selectedSubCategory === sub ? null : sub);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2 text-[10px] tracking-wide font-light transition-all",
                        selectedSubCategory === sub ? "text-primary font-medium" : "text-zay-text-muted hover:text-zay-text"
                      )}
                    >
                      <div className={cn(
                        "w-3 h-3 border border-zay-border/50 flex items-center justify-center transition-colors",
                        selectedSubCategory === sub && "bg-primary/20 border-primary"
                      )}>
                        {selectedSubCategory === sub && <div className="w-1.5 h-1.5 bg-primary" />}
                      </div>
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zay-text-muted">TAILLE</h4>
        <div className="flex flex-wrap gap-2">
          {SIZES.map(size => (
            <button
              type="button"
              key={size}
              onClick={() => setSelectedSize(selectedSize === size ? null : size)}
              className={cn(
                "w-9 h-9 border text-[10px] font-light transition-all flex items-center justify-center",
                selectedSize === size ? "bg-black text-white border-black" : "border-zay-border text-zay-text hover:border-black"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zay-text-muted">COULEUR</h4>
        <div className="flex flex-wrap gap-3">
          {COLORS.map(color => (
            <button
              type="button"
              key={color.name}
              onClick={() => setSelectedColor(selectedColor === color.name ? null : color.name)}
              className={cn(
                "w-7 h-7 rounded-full border p-0.5 transition-all",
                selectedColor === color.name ? "border-primary scale-110" : "border-transparent"
              )}
              title={color.name}
            >
              <div className="w-full h-full rounded-full border border-black/5" style={{ backgroundColor: color.hex }} />
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex justify-between items-end">
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zay-text-muted">PRIX</h4>
          <span className="text-[11px] font-light">{priceRange[0]}€ - {priceRange[1]}€</span>
        </div>
        <Slider 
          defaultValue={[0, 500]} 
          max={500} 
          step={10} 
          value={priceRange} 
          onValueChange={setPriceRange}
          className="py-2"
        />
      </section>

      <button 
        type="button"
        className="text-[10px] uppercase tracking-widest text-primary underline underline-offset-4 font-bold pt-4"
        onClick={resetFilters}
      >
        Réinitialiser les filtres
      </button>
    </div>
  );

  const liveSearchResults = useMemo(() => {
    const q = searchDraft.trim().toLowerCase();
    if (!q) return [];
    return (products || [])
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.subcategoryName || '').toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [products, searchDraft]);

  const SearchMenu = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed inset-0 z-[100] bg-white pt-20 md:pt-28 px-4 md:px-10 lg:px-16 overflow-y-auto"
    >
      <button 
        type="button"
        onClick={() => setShowSearchMenu(false)}
        className="absolute top-6 md:top-8 left-4 md:left-10 text-zay-text hover:text-primary transition-colors"
      >
        <ArrowLeft size={24} strokeWidth={1} />
      </button>

      <div className="w-full max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-10 md:space-y-14 pb-24">
        <form
          className="relative max-w-xl md:max-w-2xl mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
            applySearchAndClose();
          }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" strokeWidth={1} />
          <Input 
            autoFocus
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Rechercher une robe, une tenue..." 
            className="w-full bg-[#F5F5F5] border-none rounded-full h-14 md:h-16 pl-12 pr-12 text-base md:text-lg font-light"
          />
          <Camera className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" strokeWidth={1} />
        </form>

        {/* Résultats live pendant la saisie */}
        {searchDraft.trim().length > 0 && (
          <section className="space-y-4 max-w-xl md:max-w-2xl mx-auto">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-[10px] tracking-[0.2em] uppercase font-bold text-zay-text-muted">
                Résultats ({liveSearchResults.length})
              </h3>
              <button
                type="button"
                onClick={() => applySearchAndClose()}
                className="text-[10px] uppercase tracking-widest font-bold text-primary"
              >
                Voir tout →
              </button>
            </div>
            {liveSearchResults.length === 0 ? (
              <p className="text-sm italic text-zay-text-muted py-4">Aucun produit pour « {searchDraft} »</p>
            ) : (
              <div className="divide-y divide-zay-border border border-zay-border">
                {liveSearchResults.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => {
                      setSearchQuery(p.name);
                      setSearchDraft(p.name);
                      setSelectedCategory(p.category.toUpperCase());
                      setSelectedSubCategory(null);
                      setShowSearchMenu(false);
                    }}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-zay-rose-pale/40 transition-colors"
                  >
                    <div className="relative w-12 h-16 bg-zay-gray overflow-hidden shrink-0">
                      <MediaImage src={p.image} alt={p.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-widest truncate">{p.name}</p>
                      <p className="text-[0.6rem] text-zay-text-muted italic mt-1">
                        {p.category} · {p.price.toFixed(2)}€
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="space-y-6">
          <h3 className="text-[10px] md:text-[11px] tracking-[0.2em] uppercase font-bold text-zay-text-muted">
            Shopper par moment
          </h3>
          <div className="flex gap-4 md:gap-8 overflow-x-auto md:overflow-visible no-scrollbar md:justify-between -mx-2 px-2 md:mx-0 md:px-0">
            {OCCASIONS.map((occ) => {
              const active =
                selectedCategory === occ.category &&
                (occ.sub ? selectedSubCategory === occ.sub : !selectedSubCategory);
              return (
              <button 
                type="button"
                key={occ.label}
                onClick={() => applyCategoryAndClose(occ.category, occ.sub)}
                className="flex flex-col items-center gap-3 min-w-[80px] md:min-w-0 md:flex-1"
              >
                <div
                  className={cn(
                    "w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-zay-rose-pale flex items-center justify-center text-primary border transition-all",
                    active ? "border-primary ring-2 ring-primary/25" : "border-primary/5"
                  )}
                >
                  <occ.icon size={24} strokeWidth={1} className="md:w-7 md:h-7" />
                </div>
                <span className={cn(
                  "text-[9px] md:text-[10px] uppercase tracking-widest font-bold",
                  active && "text-primary"
                )}>
                  {occ.label}
                </span>
              </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-[10px] md:text-[11px] tracking-[0.2em] uppercase font-bold text-zay-text-muted">
            Shoppez par catégorie
          </h3>
          <div className="flex gap-5 md:gap-8 lg:gap-12 overflow-x-auto md:overflow-visible no-scrollbar md:flex-wrap md:justify-between pb-1 -mx-2 px-2 md:mx-0 md:px-0">
            {filterStructure.map((cat) => (
              <button
                type="button"
                key={`search-bubble-${cat.label}`}
                onClick={() => applyCategoryAndClose(cat.label, null)}
                className="flex flex-col items-center text-center min-w-[88px] md:min-w-[120px] lg:min-w-[140px]"
              >
                <div
                  className={cn(
                    "relative w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 rounded-full overflow-hidden mb-3 border shadow-sm transition-all",
                    selectedCategory === cat.label
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-gray-50"
                  )}
                >
                  <MediaImage src={cat.image} alt={cat.label} fill className="object-cover" />
                </div>
                <span
                  className={cn(
                    "text-[0.55rem] md:text-[0.7rem] font-black tracking-[0.12em] uppercase whitespace-nowrap max-w-[120px] truncate",
                    selectedCategory === cat.label ? "text-primary" : "text-black"
                  )}
                >
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-[10px] md:text-[11px] tracking-[0.2em] uppercase font-bold text-zay-text-muted mb-6">
            Catégories
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
            {filterStructure.map((group) => (
              <button 
                type="button"
                key={group.label}
                onClick={() => applyCategoryAndClose(group.label, null)}
                className="w-full flex items-center justify-between py-4 border-b border-zay-border group hover:pl-2 transition-all"
              >
                <span className={cn(
                  "text-xs md:text-sm uppercase tracking-[0.15em] font-light",
                  selectedCategory === group.label && "text-primary font-bold"
                )}>
                  {group.label}
                </span>
                <ChevronRight size={16} className="text-zay-text-muted" strokeWidth={1} />
              </button>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-grow pt-40 md:pt-48 pb-24">
        <div className="container mx-auto px-4 md:px-12 max-w-screen-2xl">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10 md:mb-16">
            <h1 className="text-6xl md:text-7xl font-headline italic font-light">Catalogue</h1>
            
            <div className="flex flex-wrap items-center gap-6">
              <div
                className="relative w-full md:w-64 lg:w-80 cursor-pointer"
                onClick={() => {
                  setSearchDraft(searchQuery);
                  setShowSearchMenu(true);
                }}
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1} />
                <Input 
                  readOnly
                  value={searchQuery}
                  placeholder="Rechercher..." 
                  className="w-full bg-[#F5F5F5] border-none rounded-full h-12 pl-12 pr-12 text-base font-light cursor-pointer"
                />
              </div>

              <div className="hidden lg:flex items-center gap-8">
                <div className="flex items-center gap-4">
                  <button type="button" className="text-zay-text-muted hover:text-primary transition-colors"><LayoutGrid size={20} strokeWidth={1.5} /></button>
                  <button type="button" className="text-primary"><Grid2X2 size={20} strokeWidth={1.5} /></button>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zay-text-muted">TRIER PAR :</span>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                    <SelectTrigger className="w-[180px] border-none bg-zay-main rounded-none h-12 text-[11px] font-light uppercase tracking-widest focus:ring-0">
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-zay-border">
                      <SelectItem value="new">NOUVEAUTÉS</SelectItem>
                      <SelectItem value="price-asc">PRIX CROISSANT</SelectItem>
                      <SelectItem value="price-desc">PRIX DÉCROISSANT</SelectItem>
                      <SelectItem value="popular">POPULARITÉ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="lg:hidden flex-grow">
                <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full rounded-full h-12 px-6 border-zay-border font-light text-[11px] uppercase tracking-widest">
                      <SlidersHorizontal size={14} className="mr-2" strokeWidth={1} /> Filtrer
                      {(selectedCategory || selectedSubCategory || selectedSize || selectedColor || onlyNew) && (
                        <span className="ml-2 w-2 h-2 rounded-full bg-primary" />
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-md p-0 border-none bg-white">
                    <div className="h-full flex flex-col">
                      <SheetHeader className="p-8 border-b border-zay-border flex flex-row items-center justify-between space-y-0">
                        <SheetTitle className="text-xl font-headline italic font-light">Filtres</SheetTitle>
                        <button type="button" className="text-[10px] uppercase tracking-widest text-primary underline underline-offset-4 font-bold" onClick={resetFilters}>
                          Effacer tout
                        </button>
                      </SheetHeader>
                      <div className="flex-grow overflow-y-auto p-8">
                        <FiltersContent />
                      </div>
                      <div className="p-8 border-t border-zay-border">
                        <Button
                          type="button"
                          onClick={() => setFilterOpen(false)}
                          className="w-full bg-black text-white rounded-none py-7 text-[10px] uppercase tracking-[0.2em] font-bold"
                        >
                          Afficher les résultats ({filteredProducts.length})
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>

          {/* Bulles catégories — mobile / tablette (comme home) */}
          <div className="lg:hidden mb-10 -mx-4 px-4">
            {loadingCats && filterStructure.length === 0 ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-primary" size={20} />
              </div>
            ) : (
              <div className="flex overflow-x-auto no-scrollbar gap-5 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedSubCategory(null);
                  }}
                  className="flex flex-col items-center text-center min-w-[88px] group"
                >
                  <div
                    className={cn(
                      "relative w-20 h-20 rounded-full overflow-hidden mb-3 border shadow-sm flex items-center justify-center bg-zay-rose-pale transition-all",
                      !selectedCategory ? "border-primary ring-2 ring-primary/30" : "border-gray-50"
                    )}
                  >
                    <span className="text-[0.55rem] font-black tracking-widest uppercase text-primary">All</span>
                  </div>
                  <span className={cn(
                    "text-[0.55rem] font-black tracking-[0.15em] uppercase whitespace-nowrap",
                    !selectedCategory ? "text-primary" : "text-black"
                  )}>
                    Tout
                  </span>
                </button>
                {filterStructure.map((cat) => (
                  <button
                    type="button"
                    key={cat.label}
                    onClick={() => selectCategoryBubble(cat.label)}
                    className="flex flex-col items-center text-center min-w-[88px] group"
                  >
                    <div
                      className={cn(
                        "relative w-20 h-20 rounded-full overflow-hidden mb-3 border shadow-sm transition-all",
                        selectedCategory === cat.label
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-gray-50"
                      )}
                    >
                      <MediaImage
                        src={cat.image}
                        alt={cat.label}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[0.55rem] font-black tracking-[0.12em] uppercase whitespace-nowrap max-w-[96px] truncate",
                        selectedCategory === cat.label ? "text-primary" : "text-black"
                      )}
                    >
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <AnimatePresence>
            {showSearchMenu && <SearchMenu />}
          </AnimatePresence>

          <div className="flex flex-col lg:flex-row gap-16">
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-44 space-y-12 pr-8 border-r border-zay-border/30">
                <FiltersContent />
              </div>
            </aside>

            <div className="flex-grow">
              {(!mounted || loading) ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="aspect-[3/4] bg-zay-gray animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-y-16">
                  {filteredProducts.map((product) => (
                    <ProductCard 
                      key={product.id}
                      id={product.id}
                      slug={product.slug}
                      name={product.name}
                      price={product.price}
                      originalPrice={product.originalPrice}
                      image={product.image}
                      category={product.category}
                      badge={product.badge}
                      sizes={product.sizes}
                      sizeStock={sizeStockMap(product)}
                      outOfStock={isProductFullyOutOfStock(product)}
                    />
                  ))}
                  
                  {filteredProducts.length === 0 && (
                    <div className="col-span-full py-40 text-center bg-zay-main flex flex-col items-center justify-center space-y-6">
                      <p className="text-zay-text-muted italic tracking-widest text-base font-light">Aucune pièce ne correspond à votre sélection.</p>
                      <Button 
                        onClick={resetFilters} 
                        className="bg-zay-text text-white rounded-none px-10 py-6 text-[10px] tracking-widest font-bold uppercase"
                      >
                        Réinitialiser les filtres
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
