"use client"

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, MoreVertical, Trash2, Upload, Loader2, Edit2, Eye } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MediaImage } from '@/components/ui/media-image';
import { cn } from '@/lib/utils';
import { createProduct, deleteProduct, updateProduct } from '@/lib/api';
import { API_ORIGIN } from '@/lib/api/config';
import { getSubcategoriesFor, useCategories } from '@/hooks/use-categories';
import { useProducts } from '@/hooks/use-products';
import type { ProductVariantPayload, UiProduct } from '@/lib/api';
import { notify, notifyError, notifySuccess } from '@/lib/notify';
import { AdminBusyOverlay } from '@/components/admin/admin-busy-overlay';

type VariantFormRow = {
  key: string;
  size: string;
  colorName: string;
  colorHex: string;
  stock: string;
};

type EditableProduct = {
  id: string;
  name: string;
  categoryId: string;
  subcategoryId: string;
  price: string;
  originalPrice: string;
  stock: string;
  image: string;
  imageFile?: File | null;
  /** URLs galerie (hors couverture) */
  galleryUrls: string[];
  galleryFiles: File[];
  description: string;
  badge: string;
  variants: VariantFormRow[];
};

function toStoragePath(url: string): string {
  if (url.startsWith(API_ORIGIN)) return url.slice(API_ORIGIN.length) || url;
  if (url.startsWith('blob:')) return url;
  return url;
}

const emptyVariant = (): VariantFormRow => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  size: '',
  colorName: '',
  colorHex: '#D4537E',
  stock: '0',
});

function sanitizeStock(raw: string): string {
  if (raw.trim() === '') return '';
  const n = Number(raw);
  if (Number.isFinite(n) && n < 0) return '0';
  const digits = raw.replace(/[^\d]/g, '');
  if (digits === '') return '';
  return String(parseInt(digits, 10));
}

function parseStock(raw: string): number {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function blockNonIntegerKeys(e: React.KeyboardEvent<HTMLInputElement>) {
  if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) e.preventDefault();
}

function toVariantPayloads(rows: VariantFormRow[]): ProductVariantPayload[] {
  return rows
    .filter((v) => v.size.trim() && v.colorName.trim())
    .map((v) => ({
      size: v.size.trim(),
      colorName: v.colorName.trim(),
      colorHex: v.colorHex.trim() || undefined,
      stock: parseStock(v.stock),
    }));
}

function VariantsFields({
  variants,
  onChange,
}: {
  variants: VariantFormRow[];
  onChange: (next: VariantFormRow[]) => void;
}) {
  const updateRow = (key: string, patch: Partial<VariantFormRow>) => {
    onChange(variants.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">
          Variantes (taille / couleur)
        </Label>
        <Button
          type="button"
          variant="outline"
          className="border-primary text-primary h-8 px-3 rounded-none text-[0.6rem] font-bold uppercase"
          onClick={() => onChange([...variants, emptyVariant()])}
        >
          <Plus className="w-3 h-3 mr-1" /> Ajouter
        </Button>
      </div>

      {variants.length === 0 ? (
        <p className="text-[0.65rem] text-zay-text-muted italic">
          Aucune variante — le stock produit sera utilisé.
        </p>
      ) : (
        <div className="space-y-3">
          {variants.map((v) => (
            <div
              key={v.key}
              className="grid grid-cols-[1fr_1fr_auto_1fr_auto] gap-2 items-end border border-zay-border p-3"
            >
              <div className="space-y-1">
                <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">Taille</Label>
                <Input
                  value={v.size}
                  onChange={(e) => updateRow(v.key, { size: e.target.value })}
                  placeholder="S / M / L"
                  className="rounded-none h-10 font-bold text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">Couleur</Label>
                <Input
                  value={v.colorName}
                  onChange={(e) => updateRow(v.key, { colorName: e.target.value })}
                  placeholder="Rose ZAY"
                  className="rounded-none h-10 font-bold text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">Hex</Label>
                <Input
                  type="color"
                  value={v.colorHex || '#D4537E'}
                  onChange={(e) => updateRow(v.key, { colorHex: e.target.value })}
                  className="rounded-none h-10 w-12 p-1 cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">Stock</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={v.stock}
                  onKeyDown={blockNonIntegerKeys}
                  onChange={(e) =>
                    updateRow(v.key, { stock: sanitizeStock(e.target.value) })
                  }
                  className="rounded-none h-10 font-bold text-xs"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-zay-text-muted hover:text-red-500"
                onClick={() => onChange(variants.filter((row) => row.key !== v.key))}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type GalleryThumb = { key: string; src: string };

type ProductFormFieldsProps = {
  name: string;
  categoryId: string;
  subcategoryId: string;
  price: string;
  originalPrice: string;
  stock: string;
  coverPreview: string;
  gallery: GalleryThumb[];
  description: string;
  badge: string;
  variants: VariantFormRow[];
  categories: ReturnType<typeof useCategories>['data'];
  coverRef: React.RefObject<HTMLInputElement | null>;
  galleryRef: React.RefObject<HTMLInputElement | null>;
  onCoverFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGalleryFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveGallery: (key: string) => void;
  onChange: (patch: {
    name?: string;
    categoryId?: string;
    subcategoryId?: string;
    price?: string;
    originalPrice?: string;
    stock?: string;
    description?: string;
    badge?: string;
    variants?: VariantFormRow[];
  }) => void;
};

function ProductFormFields({
  name,
  categoryId,
  subcategoryId,
  price,
  originalPrice,
  stock,
  coverPreview,
  gallery,
  description,
  badge,
  variants,
  categories,
  coverRef,
  galleryRef,
  onCoverFile,
  onGalleryFile,
  onRemoveGallery,
  onChange,
}: ProductFormFieldsProps) {
  const subs = getSubcategoriesFor(categories, categoryId);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => coverRef.current?.click()}
          className={cn(
            'relative h-36 w-28 shrink-0 overflow-hidden border bg-zay-main group',
            coverPreview ? 'border-zay-rose' : 'border-dashed border-zay-border',
          )}
        >
          {coverPreview ? (
            <>
              <MediaImage src={coverPreview} alt="Couverture" fill className="object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center text-[0.5rem] font-bold uppercase tracking-widest text-white opacity-0 group-hover:opacity-100">
                Changer
              </span>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-zay-text-muted px-2">
              <Upload className="w-5 h-5" />
              <p className="text-[0.5rem] font-bold uppercase tracking-wider text-center leading-tight">
                Photo
              </p>
            </div>
          )}
          <input
            type="file"
            ref={coverRef}
            className="hidden"
            accept="image/*"
            onChange={onCoverFile}
          />
        </button>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
              Nom
            </Label>
            <Input
              required
              value={name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="rounded-none h-10 font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                Catégorie
              </Label>
              <select
                required
                className="w-full h-10 border border-zay-border rounded-none text-[0.65rem] font-bold uppercase tracking-widest px-3"
                value={categoryId}
                onChange={(e) =>
                  onChange({ categoryId: e.target.value, subcategoryId: '' })
                }
              >
                <option value="">Sélectionner</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
                Sous-catégorie
              </Label>
              <select
                className="w-full h-10 border border-zay-border rounded-none text-[0.65rem] font-bold uppercase tracking-widest px-3 disabled:opacity-50"
                value={subcategoryId}
                onChange={(e) => onChange({ subcategoryId: e.target.value })}
                disabled={!categoryId}
              >
                <option value="">Aucune</option>
                {subs?.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
            Prix (€)
          </Label>
          <Input
            required
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => onChange({ price: e.target.value })}
            className="rounded-none h-10 font-bold"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
            Prix barré
          </Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={originalPrice}
            onChange={(e) => onChange({ originalPrice: e.target.value })}
            placeholder="—"
            className="rounded-none h-10 font-bold"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
            Stock
          </Label>
          <Input
            required={variants.length === 0}
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={stock}
            onKeyDown={blockNonIntegerKeys}
            onChange={(e) => onChange({ stock: sanitizeStock(e.target.value) })}
            disabled={variants.length > 0}
            className="rounded-none h-10 font-bold disabled:opacity-50"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
          Badge
        </Label>
        <Input
          value={badge}
          onChange={(e) => onChange({ badge: e.target.value })}
          placeholder="NEW, PROMO…"
          className="rounded-none h-10 font-bold"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
            Galerie
          </Label>
          <Button
            type="button"
            variant="outline"
            onClick={() => galleryRef.current?.click()}
            className="h-8 rounded-none border-zay-border px-3 text-[0.55rem] font-bold uppercase tracking-widest"
          >
            <Plus className="w-3 h-3 mr-1" /> Photos
          </Button>
        </div>
        <input
          type="file"
          ref={galleryRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={onGalleryFile}
        />
        {gallery.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {gallery.map((item) => (
              <div
                key={item.key}
                className="relative h-16 w-12 overflow-hidden bg-zay-gray"
              >
                <MediaImage src={item.src} alt="" fill className="object-cover" />
                <button
                  type="button"
                  className="absolute right-0 top-0 bg-white/90 px-1 text-[0.5rem] font-bold leading-4"
                  onClick={() => onRemoveGallery(item.key)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[0.6rem] text-zay-text-muted italic">
            Optionnel — photos supplémentaires de la fiche.
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-[0.55rem] font-bold uppercase tracking-widest text-zay-text-muted">
          Description
        </Label>
        <Textarea
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="rounded-none min-h-[72px] font-bold text-sm"
        />
      </div>

      <VariantsFields
        variants={variants}
        onChange={(next) => onChange({ variants: next })}
      />
    </div>
  );
}

export default function AdminProductsPage() {
  const { data: categories } = useCategories();
  const { data: products, loading, refetch } = useProducts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyLabel, setBusyLabel] = useState('Enregistrement…');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const galleryAddRef = useRef<HTMLInputElement>(null);
  const galleryEditRef = useRef<HTMLInputElement>(null);
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    categoryId: '',
    subcategoryId: '',
    price: '',
    originalPrice: '',
    stock: '',
    image: '',
    imageFile: null as File | null,
    galleryFiles: [] as File[],
    galleryPreviews: [] as string[],
    description: '',
    badge: '',
    variants: [] as VariantFormRow[],
  });

  const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, mode: 'add' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (mode === 'add') {
      setNewProduct((prev) => ({ ...prev, image: preview, imageFile: file }));
    } else {
      setEditingProduct((prev) =>
        prev ? { ...prev, image: preview, imageFile: file } : prev,
      );
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>, mode: 'add' | 'edit') => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (mode === 'add') {
      setNewProduct((prev) => ({
        ...prev,
        galleryFiles: [...prev.galleryFiles, ...files],
        galleryPreviews: [
          ...prev.galleryPreviews,
          ...files.map((f) => URL.createObjectURL(f)),
        ],
      }));
    } else {
      setEditingProduct((prev) =>
        prev
          ? {
              ...prev,
              galleryFiles: [...prev.galleryFiles, ...files],
            }
          : prev,
      );
    }
    e.target.value = '';
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!newProduct.imageFile && !newProduct.image) {
      notify('Ajoutez une image produit.');
      return;
    }

    setBusyLabel('Enregistrement…');
    setSaving(true);
    try {
      const variants = toVariantPayloads(newProduct.variants);
      await createProduct({
        name: newProduct.name,
        categoryId: newProduct.categoryId,
        subcategoryId: newProduct.subcategoryId || undefined,
        price: parseFloat(newProduct.price) || 0,
        originalPrice: newProduct.originalPrice.trim()
          ? parseFloat(newProduct.originalPrice)
          : undefined,
        stock: variants.length > 0 ? undefined : parseStock(newProduct.stock),
        image: newProduct.imageFile
          ? undefined
          : newProduct.image || `https://picsum.photos/seed/${Date.now()}/400/600`,
        imageFile: newProduct.imageFile,
        galleryFiles: newProduct.galleryFiles,
        description: newProduct.description || undefined,
        badge: newProduct.badge || undefined,
        isNew: true,
        isPromo: !!(
          newProduct.originalPrice.trim() &&
          parseFloat(newProduct.originalPrice) > (parseFloat(newProduct.price) || 0)
        ),
        variants: variants.length > 0 ? variants : undefined,
      });

      notifySuccess(`Produit « ${newProduct.name.trim()} » créé.`);
      setIsAddModalOpen(false);
      setNewProduct({ 
        name: '', categoryId: '', subcategoryId: '', price: '', 
        originalPrice: '', stock: '', image: '', imageFile: null,
        galleryFiles: [], galleryPreviews: [],
        description: '', badge: '',
        variants: [],
      });
      await refetch();
    } catch (err) {
      notifyError(err, 'Erreur création produit');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || saving) return;

    setBusyLabel('Mise à jour…');
    setSaving(true);
    try {
      const variants = toVariantPayloads(editingProduct.variants);
      await updateProduct(editingProduct.id, {
        name: editingProduct.name,
        categoryId: editingProduct.categoryId,
        subcategoryId: editingProduct.subcategoryId || undefined,
        price: parseFloat(editingProduct.price) || 0,
        // Champ vide → null pour effacer le prix barré (sinon l'ancien reste)
        originalPrice: editingProduct.originalPrice.trim()
          ? parseFloat(editingProduct.originalPrice)
          : null,
        stock: variants.length > 0 ? undefined : parseStock(editingProduct.stock),
        image: editingProduct.imageFile
          ? undefined
          : toStoragePath(editingProduct.image),
        imageFile: editingProduct.imageFile || undefined,
        images: editingProduct.galleryUrls.map(toStoragePath),
        galleryFiles: editingProduct.galleryFiles,
        description: editingProduct.description || undefined,
        badge: editingProduct.badge || undefined,
        isPromo: !!(
          editingProduct.originalPrice.trim() &&
          parseFloat(editingProduct.originalPrice) >
            (parseFloat(editingProduct.price) || 0)
        ),
        // Toujours envoyer le tableau (même vide) pour remplacer côté API
        variants,
      });

      notifySuccess(`Produit « ${editingProduct.name.trim()} » mis à jour.`);
      setIsEditModalOpen(false);
      await refetch();
    } catch (err) {
      notifyError(err, 'Erreur mise à jour produit');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: UiProduct) => {
    if (saving) return;
    setBusyLabel('Suppression…');
    setSaving(true);
    try {
      await deleteProduct(product.id);
      notifySuccess(`Produit « ${product.name} » supprimé.`);
      await refetch();
    } catch (err) {
      notifyError(err, 'Erreur suppression produit');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (product: UiProduct) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId || '',
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      stock: product.stock.toString(),
      image: product.image,
      imageFile: null,
      galleryUrls: (product.images || []).slice(1),
      galleryFiles: [],
      description: product.description || '',
      badge: product.badge || '',
      variants: (product.variants || []).map((v) => ({
        key: v.id,
        size: v.size,
        colorName: v.colorName,
        colorHex: v.colorHex || '#D4537E',
        stock: String(v.stock),
      })),
    });
    setIsEditModalOpen(true);
  };
  const filteredProducts = (products || []).filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <AdminBusyOverlay
        show={saving && !isAddModalOpen && !isEditModalOpen}
        label={busyLabel}
        placement="fixed"
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline italic font-bold">Gestion des Produits</h1>
          <p className="text-zay-text-muted text-xs tracking-widest uppercase italic mt-1 font-bold">{filteredProducts.length} articles au total</p>
        </div>
        
        <Dialog
          open={isAddModalOpen}
          onOpenChange={(open) => {
            if (saving && !open) return;
            setIsAddModalOpen(open);
            if (!open) document.body.style.pointerEvents = '';
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-zay-text text-white rounded-none px-6 py-6 text-[0.65rem] tracking-[0.2em] font-bold uppercase transition-all shadow-xl shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Ajouter un produit
            </Button>
          </DialogTrigger>
          <DialogContent
            className={cn(
              'rounded-none border-zay-border shadow-2xl max-w-[640px] p-0 gap-0 overflow-hidden',
              saving && '[&>button]:pointer-events-none [&>button]:opacity-0',
            )}
            onPointerDownOutside={(e) => {
              if (saving) e.preventDefault();
            }}
            onEscapeKeyDown={(e) => {
              if (saving) e.preventDefault();
            }}
          >
            <AdminBusyOverlay show={saving} label={busyLabel} />
            <div className="flex max-h-[88vh] flex-col">
              <DialogHeader className="shrink-0 border-b border-zay-border px-5 py-4">
                <DialogTitle className="text-xl font-headline italic">Nouveau produit</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                  <ProductFormFields
                    name={newProduct.name}
                    categoryId={newProduct.categoryId}
                    subcategoryId={newProduct.subcategoryId}
                    price={newProduct.price}
                    originalPrice={newProduct.originalPrice}
                    stock={newProduct.stock}
                    coverPreview={newProduct.image}
                    gallery={newProduct.galleryPreviews.map((src, i) => ({
                      key: String(i),
                      src,
                    }))}
                    description={newProduct.description}
                    badge={newProduct.badge}
                    variants={newProduct.variants}
                    categories={categories}
                    coverRef={fileInputRef}
                    galleryRef={galleryAddRef}
                    onCoverFile={(e) => handleFileChange(e, 'add')}
                    onGalleryFile={(e) => handleGalleryChange(e, 'add')}
                    onRemoveGallery={(key) => {
                      const i = Number(key);
                      setNewProduct((prev) => ({
                        ...prev,
                        galleryFiles: prev.galleryFiles.filter((_, idx) => idx !== i),
                        galleryPreviews: prev.galleryPreviews.filter((_, idx) => idx !== i),
                      }));
                    }}
                    onChange={(patch) =>
                      setNewProduct((prev) => ({ ...prev, ...patch }))
                    }
                  />
                </div>
                <DialogFooter className="shrink-0 border-t border-zay-border px-5 py-3">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-primary hover:bg-zay-text text-white rounded-none w-full h-11 text-[0.65rem] font-bold uppercase tracking-[0.2em]"
                  >
                    Enregistrer
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zay-text-muted" />
        <Input 
          placeholder="Rechercher par nom ou catégorie..." 
          className="pl-10 h-12 border-zay-border rounded-none font-bold" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      <div className="bg-white border border-zay-border shadow-sm">
        {loading && products.length === 0 ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : products?.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <p className="text-zay-text-muted italic font-bold">Aucun produit en ligne.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-zay-main/30">
              <TableRow>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest pl-6 py-4">Produit</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest">Catégorie</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest">Prix</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest text-center">Stock</TableHead>
                <TableHead className="text-[0.6rem] font-bold uppercase tracking-widest pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-zay-rose-pale/30">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-16 bg-zay-gray overflow-hidden">
                        <MediaImage src={product.image} alt={product.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{product.name}</p>
                        {product.variants?.length > 0 && (
                          <p className="text-[0.55rem] text-zay-text-muted uppercase tracking-widest mt-1">
                            {product.variants.length} variante{product.variants.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs italic text-zay-text-muted font-bold">
                    {product.category} {product.subcategoryName ? `• ${product.subcategoryName}` : ''}
                  </TableCell>
                  <TableCell className="text-xs font-bold">{product.price.toFixed(2)}€</TableCell>
                  <TableCell className="text-center text-xs font-bold">{product.stock}</TableCell>
                  <TableCell className="pr-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={16} /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-none border-zay-border">
                        <DropdownMenuItem
                          className="text-[0.6rem] font-bold uppercase py-2 cursor-pointer"
                          onSelect={() => {
                            window.open(
                              `/produit/${encodeURIComponent(product.slug || product.id)}`,
                              '_blank',
                              'noopener,noreferrer',
                            );
                          }}
                        >
                          <Eye size={12} className="mr-2" /> Voir
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-[0.6rem] font-bold uppercase py-2 cursor-pointer"
                          onSelect={() => {
                            // Attendre la fermeture du menu (sinon body reste pointer-events:none)
                            setTimeout(() => openEditModal(product), 50);
                          }}
                        >
                          <Edit2 size={12} className="mr-2" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-[0.6rem] font-bold uppercase py-2 text-red-500 cursor-pointer"
                          onSelect={() => {
                            setTimeout(() => void handleDelete(product), 50);
                          }}
                        >
                          <Trash2 size={12} className="mr-2" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        if (saving && !open) return;
        setIsEditModalOpen(open);
        if (!open) {
          document.body.style.pointerEvents = '';
          setTimeout(() => setEditingProduct(null), 300);
        }
      }}>
        <DialogContent
            className={cn(
              'rounded-none border-zay-border shadow-2xl max-w-[640px] p-0 gap-0 overflow-hidden',
              saving && '[&>button]:pointer-events-none [&>button]:opacity-0',
            )}
            onPointerDownOutside={(e) => {
              if (saving) e.preventDefault();
            }}
            onEscapeKeyDown={(e) => {
              if (saving) e.preventDefault();
            }}
          >
            <AdminBusyOverlay show={saving} label={busyLabel} />
            {editingProduct ? (
              <div className="flex max-h-[88vh] flex-col">
                <DialogHeader className="shrink-0 border-b border-zay-border px-5 py-4">
                  <DialogTitle className="text-xl font-headline italic">Modifier l&apos;article</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateProduct} className="flex min-h-0 flex-1 flex-col">
                  <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    <ProductFormFields
                      name={editingProduct.name}
                      categoryId={editingProduct.categoryId}
                      subcategoryId={editingProduct.subcategoryId}
                      price={editingProduct.price}
                      originalPrice={editingProduct.originalPrice}
                      stock={editingProduct.stock}
                      coverPreview={editingProduct.image}
                      gallery={[
                        ...editingProduct.galleryUrls.map((src) => ({
                          key: `url:${src}`,
                          src,
                        })),
                        ...editingProduct.galleryFiles.map((file, i) => ({
                          key: `file:${i}`,
                          src: URL.createObjectURL(file),
                        })),
                      ]}
                      description={editingProduct.description}
                      badge={editingProduct.badge}
                      variants={editingProduct.variants}
                      categories={categories}
                      coverRef={editFileInputRef}
                      galleryRef={galleryEditRef}
                      onCoverFile={(e) => handleFileChange(e, 'edit')}
                      onGalleryFile={(e) => handleGalleryChange(e, 'edit')}
                      onRemoveGallery={(key) => {
                        setEditingProduct((prev) => {
                          if (!prev) return prev;
                          if (key.startsWith('url:')) {
                            const src = key.slice(4);
                            return {
                              ...prev,
                              galleryUrls: prev.galleryUrls.filter((u) => u !== src),
                            };
                          }
                          const i = Number(key.slice(5));
                          return {
                            ...prev,
                            galleryFiles: prev.galleryFiles.filter((_, idx) => idx !== i),
                          };
                        });
                      }}
                      onChange={(patch) =>
                        setEditingProduct((prev) =>
                          prev ? { ...prev, ...patch } : prev,
                        )
                      }
                    />
                  </div>
                  <DialogFooter className="shrink-0 border-t border-zay-border px-5 py-3">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-primary hover:bg-zay-text text-white rounded-none w-full h-11 text-[0.65rem] font-bold uppercase tracking-[0.2em]"
                    >
                      Mettre à jour
                    </Button>
                  </DialogFooter>
                </form>
              </div>
            ) : null}
          </DialogContent>
      </Dialog>
    </div>
  );
}
