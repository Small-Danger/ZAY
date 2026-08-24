"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Grid, FolderTree, Loader2 } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
} from '@/lib/api';
import { getSubcategoriesFor, useCategories } from '@/hooks/use-categories';
import { cn } from '@/lib/utils';
import { notifyError } from '@/lib/notify';

export default function AdminCategoriesPage() {
  const { data: categories, loading: loadingCats, refetch } = useCategories();
  
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState<File | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [newSubImage, setNewSubImage] = useState<File | null>(null);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const subcategories = getSubcategoriesFor(categories, selectedCatId);
  const loadingSubs = loadingCats && !!selectedCatId;

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || saving) return;

    setSaving(true);
    try {
      await createCategory(newCatName.toUpperCase(), newCatImage);
      setNewCatName('');
      setNewCatImage(null);
      setIsCatModalOpen(false);
      await refetch();
    } catch (err) {
      notifyError(err, 'Erreur création catégorie');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId || !newSubName || saving) return;

    setSaving(true);
    try {
      await createSubcategory(selectedCatId, newSubName, newSubImage);
      setNewSubName('');
      setNewSubImage(null);
      setIsSubModalOpen(false);
      await refetch();
    } catch (err) {
      notifyError(err, 'Erreur création sous-catégorie');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      if (selectedCatId === id) setSelectedCatId(null);
      await refetch();
    } catch (err) {
      notifyError(err, 'Erreur suppression catégorie');
    }
  };

  const handleDeleteSubcategory = async (subId: string) => {
    if (!selectedCatId) return;
    try {
      await deleteSubcategory(selectedCatId, subId);
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
        
        <Dialog
          open={isCatModalOpen}
          onOpenChange={(open) => {
            setIsCatModalOpen(open);
            if (!open) document.body.style.pointerEvents = '';
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-zay-text text-white rounded-none px-6 py-6 text-[0.65rem] tracking-[0.2em] font-bold uppercase">
              <Plus className="w-4 h-4 mr-2" /> Nouvelle Catégorie
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none border-zay-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline italic">Créer une Catégorie</DialogTitle>
              <DialogDescription className="sr-only">
                Formulaire pour créer une catégorie du catalogue.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCategory} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Nom de la catégorie</Label>
                <Input required value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="ex: ROBES, JUPES..." className="rounded-none h-12 uppercase" />
              </div>
              <div className="space-y-2">
                <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Image (optionnel)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewCatImage(e.target.files?.[0] ?? null)}
                  className="rounded-none h-12 text-xs"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving} className="w-full bg-primary py-6 rounded-none text-[0.65rem] font-bold uppercase tracking-widest">Enregistrer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
              categories?.map((cat) => (
                <div 
                  key={cat.id} 
                  onClick={() => setSelectedCatId(cat.id)}
                  className={cn(
                    "flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-zay-rose-pale/30",
                    selectedCatId === cat.id && "bg-zay-rose-pale/50 border-l-4 border-l-primary"
                  )}
                >
                  <span className="text-xs font-bold tracking-widest uppercase">{cat.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-zay-text-muted hover:text-red-500"
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-zay-border shadow-sm">
          <div className="p-6 border-b border-zay-border bg-zay-main flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderTree className="w-4 h-4 text-primary" />
              <h2 className="text-[0.65rem] font-bold uppercase tracking-widest">
                Sous-catégories {selectedCatId && ` de ${categories?.find(c => c.id === selectedCatId)?.name}`}
              </h2>
            </div>
            {selectedCatId && (
              <Dialog
                open={isSubModalOpen}
                onOpenChange={(open) => {
                  setIsSubModalOpen(open);
                  if (!open) document.body.style.pointerEvents = '';
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-primary text-primary h-8 px-3 rounded-none text-[0.6rem] font-bold uppercase">
                    <Plus className="w-3 h-3 mr-1" /> Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-none border-zay-border">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-headline italic">Ajouter une Sous-catégorie</DialogTitle>
                    <DialogDescription className="sr-only">
                      Formulaire pour ajouter une sous-catégorie.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddSubcategory} className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Nom</Label>
                      <Input required value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="ex: Robes de soirée..." className="rounded-none h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[0.65rem] font-bold uppercase tracking-widest text-zay-text-muted">Image (optionnel)</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewSubImage(e.target.files?.[0] ?? null)}
                        className="rounded-none h-12 text-xs"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={saving} className="w-full bg-primary py-6 rounded-none text-[0.65rem] font-bold uppercase tracking-widest">Ajouter</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
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
                <div key={sub.id} className="flex items-center justify-between p-4 group">
                  <span className="text-xs font-light tracking-wide">{sub.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-zay-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteSubcategory(sub.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
