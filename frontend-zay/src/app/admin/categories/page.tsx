"use client"

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Trash2,
  Grid,
  FolderTree,
  Loader2,
  Pencil,
  ImageIcon,
  Upload,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  updateCategory,
  updateSubcategory,
  resolveMediaUrl,
  type ApiCategory,
  type ApiSubcategory,
} from '@/lib/api';
import { getSubcategoriesFor, useCategories } from '@/hooks/use-categories';
import { cn } from '@/lib/utils';
import { notifyError } from '@/lib/notify';
import { MediaImage } from '@/components/ui/media-image';

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

function CatalogImagePicker({
  currentUrl,
  file,
  onFile,
}: {
  currentUrl?: string | null;
  file: File | null;
  onFile: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const blobUrl = useObjectUrl(file);
  const existing = currentUrl ? resolveMediaUrl(currentUrl, '') : '';
  const preview = blobUrl || existing;

  return (
    <div className="space-y-2">
      <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">
        Image {currentUrl ? '' : '(optionnel)'}
      </Label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative w-full aspect-[4/3] border-2 border-dashed border-zay-border bg-zay-main overflow-hidden group',
          preview && 'border-solid border-zay-rose',
        )}
      >
        {preview ? (
          <>
            <MediaImage src={preview} alt="Aperçu" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-[0.6rem] font-bold uppercase tracking-widest">
                Changer la photo
              </p>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zay-text-muted">
            <Upload className="w-7 h-7" />
            <p className="text-[0.65rem] font-bold uppercase tracking-wider">Ajouter une image</p>
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

function CategoryThumb({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const url = src ? resolveMediaUrl(src, '') : '';
  return (
    <div className={cn('relative shrink-0 overflow-hidden bg-zay-gray', className)}>
      {url ? (
        <MediaImage src={url} alt={alt} fill className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-zay-text-muted/50">
          <ImageIcon size={18} />
        </div>
      )}
    </div>
  );
}

export default function AdminCategoriesPage() {
  const { data: categories, loading: loadingCats, refetch } = useCategories();

  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState<File | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [newSubImage, setNewSubImage] = useState<File | null>(null);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ApiCategory | null>(null);
  const [editingSub, setEditingSub] = useState<ApiSubcategory | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedCat = categories.find((c) => c.id === selectedCatId) ?? null;
  const subcategories = getSubcategoriesFor(categories, selectedCatId);
  const loadingSubs = loadingCats && !!selectedCatId;

  useEffect(() => {
    if (selectedCatId && !categories.some((c) => c.id === selectedCatId)) {
      setSelectedCatId(categories[0]?.id ?? null);
    } else if (!selectedCatId && categories.length > 0) {
      setSelectedCatId(categories[0].id);
    }
  }, [categories, selectedCatId]);

  const resetCatForm = () => {
    setNewCatName('');
    setNewCatImage(null);
    setEditingCat(null);
  };

  const resetSubForm = () => {
    setNewSubName('');
    setNewSubImage(null);
    setEditingSub(null);
  };

  const openCreateCat = () => {
    resetCatForm();
    setIsCatModalOpen(true);
  };

  const openEditCat = (cat: ApiCategory) => {
    setEditingCat(cat);
    setNewCatName(cat.name);
    setNewCatImage(null);
    setIsCatModalOpen(true);
  };

  const openCreateSub = () => {
    resetSubForm();
    setIsSubModalOpen(true);
  };

  const openEditSub = (sub: ApiSubcategory) => {
    setEditingSub(sub);
    setNewSubName(sub.name);
    setNewSubImage(null);
    setIsSubModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || saving) return;

    setSaving(true);
    try {
      if (editingCat) {
        await updateCategory(editingCat.id, {
          name: newCatName.trim().toUpperCase(),
          imageFile: newCatImage,
        });
      } else {
        const created = await createCategory(newCatName.trim().toUpperCase(), newCatImage);
        setSelectedCatId(created.id);
      }
      resetCatForm();
      setIsCatModalOpen(false);
      await refetch();
    } catch (err) {
      notifyError(err, editingCat ? 'Erreur modification catégorie' : 'Erreur création catégorie');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId || !newSubName.trim() || saving) return;

    setSaving(true);
    try {
      if (editingSub) {
        await updateSubcategory(selectedCatId, editingSub.id, {
          name: newSubName.trim(),
          imageFile: newSubImage,
        });
      } else {
        await createSubcategory(selectedCatId, newSubName.trim(), newSubImage);
      }
      resetSubForm();
      setIsSubModalOpen(false);
      await refetch();
    } catch (err) {
      notifyError(err, editingSub ? 'Erreur modification sous-catégorie' : 'Erreur création sous-catégorie');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (cat: ApiCategory) => {
    if (!window.confirm(`Supprimer « ${cat.name} » et ses sous-catégories ?`)) return;
    try {
      await deleteCategory(cat.id);
      if (selectedCatId === cat.id) setSelectedCatId(null);
      await refetch();
    } catch (err) {
      notifyError(err, 'Erreur suppression catégorie');
    }
  };

  const handleDeleteSubcategory = async (sub: ApiSubcategory) => {
    if (!selectedCatId) return;
    if (!window.confirm(`Supprimer « ${sub.name} » ?`)) return;
    try {
      await deleteSubcategory(selectedCatId, sub.id);
      await refetch();
    } catch (err) {
      notifyError(err, 'Erreur suppression sous-catégorie');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline italic">Structure du Catalogue</h1>
          <p className="text-zay-text-muted text-xs tracking-widest uppercase italic mt-1">Gérez vos catégories et sous-catégories</p>
        </div>

        <div>
          <Button
            onClick={openCreateCat}
            className="bg-primary hover:bg-zay-text text-white rounded-none px-6 py-6 text-[0.65rem] tracking-[0.2em] font-bold uppercase"
          >
            <Plus className="w-4 h-4 mr-2" /> Nouvelle Catégorie
          </Button>
          <Dialog
          open={isCatModalOpen}
          onOpenChange={(open) => {
            setIsCatModalOpen(open);
            if (!open) {
              resetCatForm();
              document.body.style.pointerEvents = '';
            }
          }}
        >
          <DialogContent className="rounded-none border-zay-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline italic">
                {editingCat ? 'Modifier la catégorie' : 'Créer une Catégorie'}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Formulaire catégorie : nom et image.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveCategory} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Nom de la catégorie</Label>
                <Input required value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="ex: ROBES, JUPES..." className="rounded-none h-12 uppercase" />
              </div>
              <CatalogImagePicker
                currentUrl={editingCat?.image}
                file={newCatImage}
                onFile={setNewCatImage}
              />
              <DialogFooter>
                <Button type="submit" disabled={saving} className="w-full bg-primary py-6 rounded-none text-[0.65rem] font-bold uppercase tracking-widest">
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white border border-zay-border shadow-sm">
          <div className="p-6 border-b border-zay-border bg-zay-main flex items-center gap-3">
            <Grid className="w-4 h-4 text-primary" />
            <h2 className="text-[0.65rem] font-bold uppercase tracking-widest">Catégories Principales</h2>
          </div>
          <div className="divide-y divide-zay-border">
            {loadingCats && categories.length === 0 ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : categories?.length === 0 ? (
              <div className="p-12 text-center italic text-zay-text-muted">Aucune catégorie définie.</div>
            ) : (
              categories?.map((cat) => {
                const subCount = cat.subcategories?.length ?? 0;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCatId(cat.id)}
                    className={cn(
                      "flex items-center gap-4 p-4 cursor-pointer transition-colors hover:bg-zay-rose-pale/30",
                      selectedCatId === cat.id && "bg-zay-rose-pale/50 border-l-4 border-l-primary"
                    )}
                  >
                    <CategoryThumb src={cat.image} alt={cat.name} className="w-14 h-16" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold tracking-widest uppercase truncate">{cat.name}</p>
                      <p className="text-[0.55rem] text-zay-text-muted uppercase tracking-widest mt-1">
                        {subCount} sous-catégorie{subCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex items-center shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zay-text-muted hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditCat(cat);
                        }}
                        aria-label={`Modifier ${cat.name}`}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zay-text-muted hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteCategory(cat);
                        }}
                        aria-label={`Supprimer ${cat.name}`}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white border border-zay-border shadow-sm">
          <div className="p-6 border-b border-zay-border bg-zay-main flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <FolderTree className="w-4 h-4 text-primary shrink-0" />
              <h2 className="text-[0.65rem] font-bold uppercase tracking-widest truncate">
                Sous-catégories {selectedCat ? ` de ${selectedCat.name}` : ''}
              </h2>
            </div>
            {selectedCatId && (
              <>
                <Button
                  variant="outline"
                  onClick={openCreateSub}
                  className="border-primary text-primary h-8 px-3 rounded-none text-[0.6rem] font-bold uppercase"
                >
                  <Plus className="w-3 h-3 mr-1" /> Ajouter
                </Button>
                <Dialog
                  open={isSubModalOpen}
                  onOpenChange={(open) => {
                    setIsSubModalOpen(open);
                    if (!open) {
                      resetSubForm();
                      document.body.style.pointerEvents = '';
                    }
                  }}
                >
                <DialogContent className="rounded-none border-zay-border">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-headline italic">
                      {editingSub ? 'Modifier la sous-catégorie' : 'Ajouter une Sous-catégorie'}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                      Formulaire sous-catégorie : nom et image.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveSubcategory} className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Nom</Label>
                      <Input required value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="ex: Robes de soirée..." className="rounded-none h-12" />
                    </div>
                    <CatalogImagePicker
                      currentUrl={editingSub?.image}
                      file={newSubImage}
                      onFile={setNewSubImage}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={saving} className="w-full bg-primary py-6 rounded-none text-[0.65rem] font-bold uppercase tracking-widest">
                        {saving ? 'Enregistrement…' : editingSub ? 'Enregistrer' : 'Ajouter'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
                </Dialog>
              </>
            )}
          </div>
          <div className="divide-y divide-zay-border">
            {!selectedCatId ? (
              <div className="p-12 text-center italic text-zay-text-muted">Sélectionnez une catégorie pour voir ses sous-catégories.</div>
            ) : loadingSubs ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : subcategories?.length === 0 ? (
              <div className="p-12 text-center italic text-zay-text-muted">Aucune sous-catégorie pour le moment.</div>
            ) : (
              subcategories?.map((sub) => (
                <div key={sub.id} className="flex items-center gap-4 p-4 group">
                  <CategoryThumb src={sub.image} alt={sub.name} className="w-12 h-14" />
                  <span className="text-xs font-light tracking-wide flex-1 truncate">{sub.name}</span>
                  <div className="flex items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zay-text-muted hover:text-primary"
                      onClick={() => openEditSub(sub)}
                      aria-label={`Modifier ${sub.name}`}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zay-text-muted hover:text-red-500"
                      onClick={() => void handleDeleteSubcategory(sub)}
                      aria-label={`Supprimer ${sub.name}`}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
