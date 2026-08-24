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
import { notifyError, notifySuccess } from '@/lib/notify';
import { AdminBusyOverlay } from '@/components/admin/admin-busy-overlay';
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
  disabled,
}: {
  currentUrl?: string | null;
  file: File | null;
  onFile: (file: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const blobUrl = useObjectUrl(file);
  const existing = currentUrl ? resolveMediaUrl(currentUrl, '') : '';
  const preview = blobUrl || existing;

  return (
    <div className="space-y-2">
      <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">
        Image
      </Label>
      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative w-24 h-28 shrink-0 border border-zay-border bg-zay-main overflow-hidden group',
            preview && 'border-zay-rose',
            disabled && 'opacity-60 cursor-wait',
          )}
        >
          {preview ? (
            <MediaImage src={preview} alt="Aperçu" fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-zay-text-muted px-2">
              <Upload className="w-5 h-5" />
              <p className="text-[0.5rem] font-bold uppercase tracking-wider text-center leading-tight">
                Ajouter
              </p>
            </div>
          )}
          {preview ? (
            <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center text-[0.5rem] font-bold uppercase tracking-widest text-white">
              Changer
            </span>
          ) : null}
        </button>
        <p className="text-[0.65rem] text-zay-text-muted leading-relaxed">
          JPEG, PNG ou WEBP · 5 Mo max
          {file ? (
            <>
              <br />
              <span className="text-zay-text font-medium">{file.name}</span>
            </>
          ) : currentUrl ? (
            <>
              <br />
              Photo actuelle — cliquez pour la remplacer
            </>
          ) : (
            <>
              <br />
              Optionnel
            </>
          )}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
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
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [url]);

  return (
    <div className={cn('relative shrink-0 overflow-hidden bg-zay-gray', className)}>
      {url && !broken ? (
        <MediaImage
          src={url}
          alt=""
          fill
          className="object-cover"
          onError={() => setBroken(true)}
        />
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        notifySuccess(`Catégorie « ${newCatName.trim().toUpperCase()} » mise à jour.`);
      } else {
        const created = await createCategory(newCatName.trim().toUpperCase(), newCatImage);
        setSelectedCatId(created.id);
        notifySuccess(`Catégorie « ${created.name} » créée.`);
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
        notifySuccess(`Sous-catégorie « ${newSubName.trim()} » mise à jour.`);
      } else {
        await createSubcategory(selectedCatId, newSubName.trim(), newSubImage);
        notifySuccess(`Sous-catégorie « ${newSubName.trim()} » ajoutée.`);
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
    setDeletingId(cat.id);
    try {
      await deleteCategory(cat.id);
      if (selectedCatId === cat.id) setSelectedCatId(null);
      notifySuccess(`Catégorie « ${cat.name} » supprimée.`);
      await refetch();
    } catch (err) {
      notifyError(err, 'Erreur suppression catégorie');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteSubcategory = async (sub: ApiSubcategory) => {
    if (!selectedCatId) return;
    if (!window.confirm(`Supprimer « ${sub.name} » ?`)) return;
    setDeletingId(sub.id);
    try {
      await deleteSubcategory(selectedCatId, sub.id);
      notifySuccess(`Sous-catégorie « ${sub.name} » supprimée.`);
      await refetch();
    } catch (err) {
      notifyError(err, 'Erreur suppression sous-catégorie');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <AdminBusyOverlay
        show={!!deletingId}
        label="Suppression…"
        placement="fixed"
      />
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
            if (saving && !open) return;
            setIsCatModalOpen(open);
            if (!open) {
              resetCatForm();
              document.body.style.pointerEvents = '';
            }
          }}
        >
          <DialogContent
            className={cn(
              'rounded-none border-zay-border max-w-[420px] p-5 gap-3 overflow-hidden',
              saving && '[&>button]:pointer-events-none [&>button]:opacity-0',
            )}
            onPointerDownOutside={(e) => {
              if (saving) e.preventDefault();
            }}
            onEscapeKeyDown={(e) => {
              if (saving) e.preventDefault();
            }}
          >
            <AdminBusyOverlay
              show={saving}
              label={editingCat ? 'Mise à jour…' : 'Enregistrement…'}
            />
            <DialogHeader>
              <DialogTitle className="text-xl font-headline italic">
                {editingCat ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </DialogTitle>
              <DialogDescription className="text-[0.65rem] text-zay-text-muted tracking-wide">
                Nom et photo de la catégorie dans le catalogue.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <fieldset disabled={saving} className="space-y-4 disabled:opacity-70">
                <div className="space-y-2">
                  <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Nom de la catégorie</Label>
                  <Input required value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="ex: ROBES, JUPES..." className="rounded-none h-11 uppercase" />
                </div>
                <CatalogImagePicker
                  currentUrl={editingCat?.image}
                  file={newCatImage}
                  onFile={setNewCatImage}
                  disabled={saving}
                />
              </fieldset>
              <DialogFooter>
                <Button type="submit" disabled={saving || !newCatName.trim()} className="w-full bg-primary h-11 rounded-none text-[0.65rem] font-bold uppercase tracking-widest">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement…
                    </>
                  ) : (
                    'Enregistrer'
                  )}
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
                        disabled={deletingId === cat.id}
                        className="h-8 w-8 text-zay-text-muted hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteCategory(cat);
                        }}
                        aria-label={`Supprimer ${cat.name}`}
                      >
                        {deletingId === cat.id ? (
                          <Loader2 size={14} className="animate-spin text-zay-text-muted" />
                        ) : (
                          <Trash2 size={14} />
                        )}
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
                    if (saving && !open) return;
                    setIsSubModalOpen(open);
                    if (!open) {
                      resetSubForm();
                      document.body.style.pointerEvents = '';
                    }
                  }}
                >
                <DialogContent
                  className={cn(
                    'rounded-none border-zay-border max-w-[420px] p-5 gap-3 overflow-hidden',
                    saving && '[&>button]:pointer-events-none [&>button]:opacity-0',
                  )}
                  onPointerDownOutside={(e) => {
                    if (saving) e.preventDefault();
                  }}
                  onEscapeKeyDown={(e) => {
                    if (saving) e.preventDefault();
                  }}
                >
                  <AdminBusyOverlay
                    show={saving}
                    label={editingSub ? 'Mise à jour…' : 'Enregistrement…'}
                  />
                  <DialogHeader>
                    <DialogTitle className="text-xl font-headline italic">
                      {editingSub ? 'Modifier la sous-catégorie' : 'Nouvelle sous-catégorie'}
                    </DialogTitle>
                    <DialogDescription className="text-[0.65rem] text-zay-text-muted tracking-wide">
                      Nom et photo de la sous-catégorie.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveSubcategory} className="space-y-4">
                    <fieldset disabled={saving} className="space-y-4 disabled:opacity-70">
                      <div className="space-y-2">
                        <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Nom</Label>
                        <Input required value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="ex: Robes de soirée..." className="rounded-none h-11" />
                      </div>
                      <CatalogImagePicker
                        currentUrl={editingSub?.image}
                        file={newSubImage}
                        onFile={setNewSubImage}
                        disabled={saving}
                      />
                    </fieldset>
                    <DialogFooter>
                      <Button type="submit" disabled={saving || !newSubName.trim()} className="w-full bg-primary h-11 rounded-none text-[0.65rem] font-bold uppercase tracking-widest">
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enregistrement…
                          </>
                        ) : editingSub ? (
                          'Enregistrer'
                        ) : (
                          'Ajouter'
                        )}
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
                      disabled={deletingId === sub.id}
                      className="h-8 w-8 text-zay-text-muted hover:text-red-500"
                      onClick={() => void handleDeleteSubcategory(sub)}
                      aria-label={`Supprimer ${sub.name}`}
                    >
                      {deletingId === sub.id ? (
                        <Loader2 size={14} className="animate-spin text-zay-text-muted" />
                      ) : (
                        <Trash2 size={14} />
                      )}
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
