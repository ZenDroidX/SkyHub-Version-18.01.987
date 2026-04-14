'use client';

import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { GripVertical } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { toast } from '@/hooks/use-toast';

const SortableItem = ({ id, config, onChange }: { id: string, config: any, onChange: (id: string, newConfig: any) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="p-4 bg-card border rounded-xl flex items-center gap-4 mb-2">
      <div {...attributes} {...listeners} className="cursor-grab"><GripVertical className="w-5 h-5 text-muted-foreground" /></div>
      <div className="flex-1 grid grid-cols-4 gap-4 items-center">
        <Label className="font-black uppercase text-[10px]">{id}</Label>
        <div className="flex items-center gap-2">
          <Switch checked={config.visible} onCheckedChange={(v) => onChange(id, { ...config, visible: v })} />
          <Label className="text-[9px]">Visible</Label>
        </div>
        <div className="space-y-1">
          <Label className="text-[8px] uppercase">Cols: {config.columns || 3}</Label>
          <Slider value={[config.columns || 3]} min={1} max={4} step={1} onValueChange={([v]) => onChange(id, { ...config, columns: v })} />
        </div>
        <div className="space-y-1">
          <Label className="text-[8px] uppercase">Gap: {config.gap || 4}</Label>
          <Slider value={[config.gap || 4]} min={0} max={10} step={1} onValueChange={([v]) => onChange(id, { ...config, gap: v })} />
        </div>
      </div>
    </div>
  );
};

export default function LayoutManager() {
  const db = useFirestore();
  const settingsRef = useMemoFirebase(() => doc(db, 'settings', 'global'), [db]);
  const { data: settings } = useDoc(settingsRef);
  const [layout, setLayout] = useState<any[]>([]);

  useEffect(() => {
    if (settings?.layoutConfig) {
      setLayout(settings.layoutConfig.sort((a: any, b: any) => a.order - b.order));
    }
  }, [settings]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setLayout((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex).map((item, index) => ({ ...item, order: index }));
      });
    }
  };

  const handleConfigChange = (id: string, newConfig: any) => {
    setLayout(prev => prev.map(item => item.id === id ? { ...item, ...newConfig } : item));
  };

  const handleSave = async () => {
    try {
      await updateDoc(settingsRef, { layoutConfig: layout });
      toast({ title: 'Layout saved!' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to save', description: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={layout.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {layout.map(item => <SortableItem key={item.id} id={item.id} config={item} onChange={handleConfigChange} />)}
        </SortableContext>
      </DndContext>
      <Button onClick={handleSave} className="w-full">Save Layout</Button>
    </div>
  );
}
