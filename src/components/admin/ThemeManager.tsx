'use client';

import { allThemes } from "@/lib/all-themes";
import { applyTheme } from "@/lib/themeManager";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { useUser, useFirestore } from "@/firebase";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

export default function ThemeManager() {
  const [customPrimary, setCustomPrimary] = useState('#2563eb');
  const [customTextColor, setCustomTextColor] = useState('#ffffff');
  const [gradientColors, setGradientColors] = useState(['#2563eb', '#1e40af']);
  const [gradientDirection, setGradientDirection] = useState(135);
  const [useGradient, setUseGradient] = useState(true);
  const customGradient = `linear-gradient(${gradientDirection}deg, ${gradientColors.join(', ')})`;
  const [customBg, setCustomBg] = useState('#0a0a0a');
  const [customFont, setCustomFont] = useState('Inter');
  const [customRadius, setCustomRadius] = useState(0.5);
  const [customSpacing, setCustomSpacing] = useState(1);
  
  const { user } = useUser();
  const db = useFirestore();

  const addColor = () => {
    setGradientColors([...gradientColors, '#2563eb']);
  };

  const removeColor = (index: number) => {
    if (gradientColors.length > 2) {
      setGradientColors(gradientColors.filter((_, i) => i !== index));
    }
  };

  const updateColor = (index: number, color: string) => {
    const newColors = [...gradientColors];
    newColors[index] = color;
    setGradientColors(newColors);
  };

  const handleApplyCustomTheme = async () => {
    await applyTheme({
      name: 'Custom',
      primary: customPrimary,
      textColor: customTextColor,
      gradient: useGradient ? customGradient : null,
      bg: customBg,
      fontFamily: customFont,
      borderRadius: `${customRadius}rem`,
      spacing: `${customSpacing}rem`
    });
    toast({ title: "Theme Applied", description: "The theme has been applied to the site." });
  };

  const handleResetToDefault = async () => {
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          theme: deleteField()
        });
        toast({ title: "Theme reset to default" });
        // Re-apply default theme
        applyTheme({
          name: 'Default Dark',
          primary: '#2563eb',
          bg: '#0a0a0a',
          fontFamily: 'Inter',
          borderRadius: '0.5rem',
          spacing: '1rem'
        });
      } catch (error) {
        console.error("Failed to reset theme", error);
        toast({ title: "Failed to reset theme", variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="p-6 bg-card border border-border rounded-2xl">
        <h3 className="text-lg font-bold mb-4">Theme Preview</h3>
        <div 
          className="p-8 rounded-2xl border transition-all duration-300 shadow-inner"
          style={{ 
            backgroundColor: useGradient ? 'transparent' : customBg,
            backgroundImage: useGradient ? customGradient : 'none',
            borderColor: customPrimary,
            fontFamily: customFont,
            borderRadius: `${customRadius}rem`,
            padding: `${customSpacing}rem`
          }}
        >
          <h4 className="text-3xl font-bold mb-4" style={{ background: useGradient ? customGradient : customPrimary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Site Preview</h4>
          <p className="mb-4 text-foreground">This is a preview of how your site will look with the selected theme.</p>
          <Button style={{ background: useGradient ? customGradient : customPrimary, color: '#fff', borderRadius: `${customRadius}rem` }}>
            Preview Button
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[400px] w-full rounded-2xl border border-border p-4 bg-muted/20">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {allThemes.map((t) => (
            <motion.div
              key={t.name}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95, y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)" }}
            >
              <Button
                onClick={() => applyTheme(t)}
                style={{ backgroundColor: t.primary, color: '#fff' }}
                className="h-20 w-full rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg transition-transform border-2 border-transparent hover:border-white/50"
              >
                <span className="font-black uppercase text-[10px] tracking-widest text-center truncate w-full px-1">{t.name}</span>
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: t.bg }} />
              </Button>
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-6 bg-card border border-border rounded-2xl space-y-6">
        <h3 className="text-lg font-bold">Advanced Theme Editor</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="w-12 h-12 p-1" />
                <Input type="text" value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Text Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={customTextColor} onChange={(e) => setCustomTextColor(e.target.value)} className="w-12 h-12 p-1" />
                <Input type="text" value={customTextColor} onChange={(e) => setCustomTextColor(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Gradient Background</Label>
              <Button 
                onClick={() => setUseGradient(!useGradient)} 
                variant={useGradient ? "default" : "outline"}
                className="w-full"
              >
                {useGradient ? "Gradient Enabled" : "Gradient Disabled"}
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Gradient Direction ({Number(gradientDirection) || 0}deg)</Label>
              <Slider value={[Number(gradientDirection) || 0]} onValueChange={(v) => setGradientDirection(v[0])} min={0} max={360} step={1} />
            </div>
            <div className="space-y-2">
              <Label>Gradient Colors</Label>
              <div className="space-y-2">
                {gradientColors.map((color, index) => (
                  <div key={index} className="flex gap-2">
                    <Input type="color" value={color || ''} onChange={(e) => updateColor(index, e.target.value)} className="w-12 h-12 p-1" />
                    <Input type="text" value={color || ''} onChange={(e) => updateColor(index, e.target.value)} className="flex-1" />
                    {gradientColors.length > 2 && (
                      <Button variant="destructive" onClick={() => removeColor(index)}>Remove</Button>
                    )}
                  </div>
                ))}
                <Button onClick={addColor} className="w-full">Add Color</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Background Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={customBg} onChange={(e) => setCustomBg(e.target.value)} className="w-12 h-12 p-1" />
                <Input type="text" value={customBg} onChange={(e) => setCustomBg(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select value={customFont} onValueChange={setCustomFont}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Space Grotesk">Space Grotesk</SelectItem>
                  <SelectItem value="Source Code Pro">Source Code Pro</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                  <SelectItem value="Montserrat">Montserrat</SelectItem>
                  <SelectItem value="Lato">Lato</SelectItem>
                  <SelectItem value="Poppins">Poppins</SelectItem>
                  <SelectItem value="Raleway">Raleway</SelectItem>
                  <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                  <SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Border Radius ({Number(customRadius) || 0}rem)</Label>
              <Slider value={[Number(customRadius) || 0]} onValueChange={(v) => setCustomRadius(v[0])} min={0} max={2} step={0.1} />
            </div>
            <div className="space-y-2">
              <Label>Spacing ({Number(customSpacing) || 0}rem)</Label>
              <Slider value={[Number(customSpacing) || 0]} onValueChange={(v) => setCustomSpacing(v[0])} min={0.5} max={2} step={0.1} />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button onClick={handleApplyCustomTheme} className="flex-1">Apply Custom Theme</Button>
          <Button onClick={handleResetToDefault} variant="outline" className="flex-1">Reset to Default</Button>
        </div>
      </div>
    </div>
  );
}
