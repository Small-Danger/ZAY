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
import { notify, notifyError } from '@/lib/notify';

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

function toVariantPayloads(rows: VariantFormRow[]): ProductVariantPayload[] {
  return rows
    .filter((v) => v.size.trim() && v.colorName.trim())
    .map((v) => ({
      size: v.size.trim(),
      colorName: v.colorName.trim(),
      colorHex: v.colorHex.trim() || undefined,
      stock: parseInt(v.stock, 10) || 0,
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
                  value={v.stock}
                  onChange={(e) => updateRow(v.key, { stock: e.target.value })}
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

export default function AdminProductsPage() {
  const { data: categories } = useCategories();
  const { data: products, loading, refetch } = useProducts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const subcategories = getSubcategoriesFor(categories, newProduct.categoryId);
  const editSubcategories = getSubcategoriesFor(categories, editingProduct?.categoryId);

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
        stock: variants.length > 0 ? undefined : parseInt(newProduct.stock) || 0,
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
        stock: variants.length > 0 ? undefined : parseInt(editingProduct.stock) || 0,
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

      setIsEditModalOpen(false);
      await refetch();
    } catch (err) {
      notifyError(err, 'Erreur mise à jour produit');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      await refetch();
    } catch (err) {
      notifyError(err, 'Erreur suppression produit');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline italic font-bold">Gestion des Produits</h1>
          <p className="text-zay-text-muted text-xs tracking-widest uppercase italic mt-1 font-bold">{filteredProducts.length} articles au total</p>
        </div>
        
        <Dialog
          open={isAddModalOpen}
          onOpenChange={(open) => {
            setIsAddModalOpen(open);
            if (!open) document.body.style.pointerEvents = '';
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-zay-text text-white rounded-none px-6 py-6 text-[0.65rem] tracking-[0.2em] font-bold uppercase transition-all shadow-xl shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Ajouter un produit
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none border-zay-border shadow-2xl max-w-4xl p-0 overflow-hidden">
            <DialogHeader className="p-8 pb-0">
              <DialogTitle className="text-3xl font-headline italic font-bold">Nouveau Produit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="p-8 pt-6 space-y-8 max-h-[85vh] overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Image de l'article</Label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "relative aspect-[3/4] border-2 border-dashed border-zay-border bg-zay-main flex flex-col items-center justify-center cursor-pointer hover:bg-zay-rose-pale transition-all group overflow-hidden",
                      newProduct.image && "border-solid border-zay-rose"
                    )}
                  >
                    {newProduct.image ? (
                      <>
                        <MediaImage src={newProduct.image} alt="Preview" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white text-[0.6rem] font-bold uppercase tracking-widest">Changer la photo</p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6 space-y-3">
                        <Upload className="w-8 h-8 mx-auto text-zay-text-muted" />
                        <p className="text-[0.65rem] font-bold uppercase tracking-wider">Télécharger</p>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'add')} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Galerie (optionnel)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => galleryAddRef.current?.click()}
                      className="w-full rounded-none border-zay-border h-10 text-[0.6rem] font-bold uppercase tracking-widest"
                    >
                      Ajouter des photos
                    </Button>
                    <input
                      type="file"
                      ref={galleryAddRef}
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleGalleryChange(e, 'add')}
                    />
                    {newProduct.galleryPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {newProduct.galleryPreviews.map((src, i) => (
                          <div key={`${src}-${i}`} className="relative aspect-[3/4] bg-zay-gray overflow-hidden">
                            <MediaImage src={src} alt="" fill className="object-cover" />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-white/90 p-1 text-[0.5rem] font-bold"
                              onClick={() =>
                                setNewProduct((prev) => ({
                                  ...prev,
                                  galleryFiles: prev.galleryFiles.filter((_, idx) => idx !== i),
                                  galleryPreviews: prev.galleryPreviews.filter((_, idx) => idx !== i),
                                }))
                              }
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Nom de l'article</Label>
                    <Input required value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="rounded-none h-12 font-bold" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Catégorie</Label>
                      <select 
                        required
                        className="w-full h-12 border border-zay-border rounded-none text-xs font-bold uppercase tracking-widest px-4" 
                        value={newProduct.categoryId} 
                        onChange={(e) => setNewProduct({...newProduct, categoryId: e.target.value, subcategoryId: ''})}
                      >
                        <option value="">Sélectionner</option>
                        {categories?.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Sous-catégorie</Label>
                      <select 
                        className="w-full h-12 border border-zay-border rounded-none text-xs font-bold uppercase tracking-widest px-4 disabled:opacity-50" 
                        value={newProduct.subcategoryId} 
                        onChange={(e) => setNewProduct({...newProduct, subcategoryId: e.target.value})}
                        disabled={!newProduct.categoryId}
                      >
                        <option value="">Aucune</option>
                        {subcategories?.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Prix (€)</Label>
                      <Input required type="number" step="0.01" min="0" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="rounded-none h-12 font-bold" />
                      <p className="text-[0.6rem] text-zay-text-muted italic">Prix de vente (ou prix promo)</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Prix d&apos;origine (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newProduct.originalPrice}
                        onChange={(e) => setNewProduct({...newProduct, originalPrice: e.target.value})}
                        placeholder="Ex: 229"
                        className="rounded-none h-12 font-bold"
                      />
                      <p className="text-[0.6rem] text-zay-text-muted italic">Optionnel — plus élevé que le prix pour activer la promo</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Stock Initial</Label>
                    <Input
                      required={newProduct.variants.length === 0}
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                      disabled={newProduct.variants.length > 0}
                      className="rounded-none h-12 font-bold disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Badge (ex: NEW, PROMO)</Label>
                    <Input value={newProduct.badge} onChange={(e) => setNewProduct({...newProduct, badge: e.target.value})} className="rounded-none h-12 font-bold" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Description</Label>
                    <Textarea value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} className="rounded-none min-h-[120px] font-bold" />
                  </div>

                  <VariantsFields
                    variants={newProduct.variants}
                    onChange={(variants) => setNewProduct({ ...newProduct, variants })}
                  />
                </div>
              </div>

              <DialogFooter className="mt-8 border-t border-zay-border pt-6">
                <Button type="submit" disabled={saving} className="bg-primary hover:bg-zay-text text-white rounded-none w-full h-14 text-[0.65rem] font-bold uppercase tracking-[0.2em]">
                  Enregistrer l'article
                </Button>
              </DialogFooter>
            </form>
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
                            setTimeout(() => handleDelete(product.id), 50);
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
        setIsEditModalOpen(open);
        if (!open) {
          document.body.style.pointerEvents = '';
          setTimeout(() => setEditingProduct(null), 300);
        }
      }}>
        <DialogContent className="rounded-none border-zay-border shadow-2xl max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-3xl font-headline italic font-bold">Modifier l'article</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <form onSubmit={handleUpdateProduct} className="p-8 pt-6 space-y-8 max-h-[85vh] overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Image de l'article</Label>
                  <div 
                    onClick={() => editFileInputRef.current?.click()}
                    className="relative aspect-[3/4] border-2 border-zay-border bg-zay-main flex flex-col items-center justify-center cursor-pointer hover:bg-zay-rose-pale transition-all group overflow-hidden"
                  >
                    <MediaImage src={editingProduct.image} alt="Preview" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-[0.6rem] font-bold uppercase tracking-widest">Changer la photo</p>
                    </div>
                    <input type="file" ref={editFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'edit')} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Galerie</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => galleryEditRef.current?.click()}
                      className="w-full rounded-none border-zay-border h-10 text-[0.6rem] font-bold uppercase tracking-widest"
                    >
                      Ajouter des photos
                    </Button>
                    <input
                      type="file"
                      ref={galleryEditRef}
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleGalleryChange(e, 'edit')}
                    />
                    {(editingProduct.galleryUrls.length > 0 || editingProduct.galleryFiles.length > 0) && (
                      <div className="grid grid-cols-3 gap-2">
                        {editingProduct.galleryUrls.map((src) => (
                          <div key={src} className="relative aspect-[3/4] bg-zay-gray overflow-hidden">
                            <MediaImage src={src} alt="" fill className="object-cover" />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-white/90 p-1 text-[0.5rem] font-bold"
                              onClick={() =>
                                setEditingProduct((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        galleryUrls: prev.galleryUrls.filter((u) => u !== src),
                                      }
                                    : prev,
                                )
                              }
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        {editingProduct.galleryFiles.map((file, i) => (
                          <div key={`${file.name}-${i}`} className="relative aspect-[3/4] bg-zay-gray overflow-hidden">
                            <MediaImage src={URL.createObjectURL(file)} alt="" fill className="object-cover" />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-white/90 p-1 text-[0.5rem] font-bold"
                              onClick={() =>
                                setEditingProduct((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        galleryFiles: prev.galleryFiles.filter((_, idx) => idx !== i),
                                      }
                                    : prev,
                                )
                              }
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Nom de l'article</Label>
                    <Input required value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="rounded-none h-12 font-bold" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Catégorie</Label>
                      <select 
                        required
                        className="w-full h-12 border border-zay-border rounded-none text-xs font-bold uppercase tracking-widest px-4" 
                        value={editingProduct.categoryId} 
                        onChange={(e) => setEditingProduct({...editingProduct, categoryId: e.target.value, subcategoryId: ''})}
                      >
                        <option value="">Sélectionner</option>
                        {categories?.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Sous-catégorie</Label>
                      <select 
                        className="w-full h-12 border border-zay-border rounded-none text-xs font-bold uppercase tracking-widest px-4 disabled:opacity-50" 
                        value={editingProduct.subcategoryId} 
                        onChange={(e) => setEditingProduct({...editingProduct, subcategoryId: e.target.value})}
                        disabled={!editingProduct.categoryId}
                      >
                        <option value="">Aucune</option>
                        {editSubcategories?.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Prix (€)</Label>
                      <Input required type="number" step="0.01" min="0" value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})} className="rounded-none h-12 font-bold" />
                      <p className="text-[0.6rem] text-zay-text-muted italic">Prix de vente (ou prix promo)</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Prix d&apos;origine (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingProduct.originalPrice}
                        onChange={(e) => setEditingProduct({...editingProduct, originalPrice: e.target.value})}
                        placeholder="Ex: 229"
                        className="rounded-none h-12 font-bold"
                      />
                      <p className="text-[0.6rem] text-zay-text-muted italic">Optionnel — plus élevé que le prix pour activer la promo</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Stock</Label>
                    <Input
                      required={editingProduct.variants.length === 0}
                      type="number"
                      value={editingProduct.stock}
                      onChange={(e) => setEditingProduct({...editingProduct, stock: e.target.value})}
                      disabled={editingProduct.variants.length > 0}
                      className="rounded-none h-12 font-bold disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Badge</Label>
                    <Input value={editingProduct.badge} onChange={(e) => setEditingProduct({...editingProduct, badge: e.target.value})} className="rounded-none h-12 font-bold" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Description</Label>
                    <Textarea value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} className="rounded-none min-h-[120px] font-bold" />
                  </div>

                  <VariantsFields
                    variants={editingProduct.variants}
                    onChange={(variants) => setEditingProduct({ ...editingProduct, variants })}
                  />
                </div>
              </div>

              <DialogFooter className="mt-8 border-t border-zay-border pt-6">
                <Button type="submit" disabled={saving} className="bg-primary hover:bg-zay-text text-white rounded-none w-full h-14 text-[0.65rem] font-bold uppercase tracking-[0.2em]">
                  Mettre à jour l'article
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
