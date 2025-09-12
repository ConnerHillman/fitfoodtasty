import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, FabricText, FabricImage, Rect, Group } from 'fabric';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3, Save, RotateCcw, Type, Move, AlignCenter } from 'lucide-react';
import { toast } from 'sonner';
import logoImage from '@/assets/fit-food-tasty-logo.png';

interface LabelData {
  mealName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  ingredients: string;
  allergens: string;
  useByDate: string;
  storageInstructions: string;
  heatingInstructions: string;
  quantity: number;
}

interface LabelEditorProps {
  data: LabelData;
  onSave: (updatedData: LabelData) => void;
  onClose: () => void;
}

export const LabelEditor: React.FC<LabelEditorProps> = ({ data, onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'text'>('select');
  const [textInput, setTextInput] = useState('');
  const [fontSize, setFontSize] = useState(12);
  const [fontWeight, setFontWeight] = useState('normal');

  // Convert mm to pixels (approximately 3.78 pixels per mm at 96 DPI)
  const mmToPx = (mm: number) => mm * 3.78;
  const pxToMm = (px: number) => px / 3.78;

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: mmToPx(99.1), // 99.1mm width
      height: mmToPx(38.1), // 38.1mm height
      backgroundColor: '#ffffff',
      selection: true,
    });

    // Initialize the label with default content
    initializeLabelContent(canvas);

    setFabricCanvas(canvas);

    // Handle object selection
    canvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0]);
    });

    canvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0]);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    return () => {
      canvas.dispose();
    };
  }, []);

  const initializeLabelContent = async (canvas: FabricCanvas) => {
    try {
      // Load logo
      const logoImg = new Image();
      logoImg.onload = () => {
        FabricImage.fromURL(logoImage)
          .then((fabricImg) => {
            if (fabricImg) {
              fabricImg.set({
                left: mmToPx(49.55) - (mmToPx(20) / 2), // Center horizontally
                top: mmToPx(2),
                scaleX: mmToPx(20) / (fabricImg.width || 1),
                scaleY: mmToPx(8) / (fabricImg.height || 1),
                selectable: true,
                hasControls: true,
                id: 'logo'
              });
              canvas.add(fabricImg);
            }
          })
          .catch((error) => {
            console.error('Error loading logo:', error);
          });
      };
      logoImg.src = logoImage;

      // Add meal name
      const mealNameText = new FabricText(data.mealName || 'Meal Name', {
        left: mmToPx(49.55),
        top: mmToPx(12),
        fontSize: mmToPx(4),
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#000000',
        textAlign: 'center',
        originX: 'center',
        originY: 'top',
        id: 'mealName'
      });
      canvas.add(mealNameText);

      // Add nutrition info
      const nutritionText = new FabricText(
        `${data.calories} Calories • ${data.protein}g Protein • ${data.fat}g Fat • ${data.carbs}g Carbs`,
        {
          left: mmToPx(49.55),
          top: mmToPx(18),
          fontSize: mmToPx(2.5),
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: '#059669',
          textAlign: 'center',
          originX: 'center',
          originY: 'top',
          id: 'nutrition'
        }
      );
      canvas.add(nutritionText);

      // Add use by date
      const useByText = new FabricText(
        `USE BY: ${data.useByDate || 'Fri, 19/09/2025'}`,
        {
          left: mmToPx(2),
          top: mmToPx(22),
          fontSize: mmToPx(2),
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: '#000000',
          id: 'useByDate'
        }
      );
      canvas.add(useByText);

      // Add storage instructions
      const storageText = new FabricText(
        data.storageInstructions || 'Store in refrigerator below 5°C',
        {
          left: mmToPx(2),
          top: mmToPx(25),
          fontSize: mmToPx(1.5),
          fontFamily: 'Arial',
          fill: '#666666',
          width: mmToPx(95),
          id: 'storage'
        }
      );
      canvas.add(storageText);

      // Add ingredients
      const ingredientsText = new FabricText(
        `Ingredients: ${data.ingredients || 'Not specified'}`,
        {
          left: mmToPx(2),
          top: mmToPx(28),
          fontSize: mmToPx(1.5),
          fontFamily: 'Arial',
          fill: '#000000',
          width: mmToPx(95),
          id: 'ingredients'
        }
      );
      canvas.add(ingredientsText);

      // Add allergens if present
      if (data.allergens) {
        const allergensText = new FabricText(
          `Allergens: ${data.allergens}`,
          {
            left: mmToPx(2),
            top: mmToPx(31),
            fontSize: mmToPx(1.5),
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fill: '#000000',
            width: mmToPx(95),
            id: 'allergens'
          }
        );
        canvas.add(allergensText);
      }

      // Add website
      const websiteText = new FabricText(
        'www.fitfoodtasty.co.uk',
        {
          left: mmToPx(49.55),
          top: mmToPx(35),
          fontSize: mmToPx(1.5),
          fontFamily: 'Arial',
          fontWeight: '500',
          fill: '#059669',
          textAlign: 'center',
          originX: 'center',
          originY: 'top',
          id: 'website'
        }
      );
      canvas.add(websiteText);

      canvas.renderAll();
    } catch (error) {
      console.error('Error initializing label content:', error);
    }
  };

  const addText = () => {
    if (!fabricCanvas || !textInput.trim()) return;

    const text = new FabricText(textInput, {
      left: mmToPx(10),
      top: mmToPx(10),
      fontSize: fontSize,
      fontFamily: 'Arial',
      fontWeight: fontWeight as any,
      fill: '#000000',
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    setTextInput('');
    toast.success('Text added to label');
  };

  const updateSelectedText = (property: string, value: any) => {
    if (!selectedObject || selectedObject.type !== 'textbox') return;

    selectedObject.set(property, value);
    fabricCanvas?.renderAll();
  };

  const centerHorizontally = () => {
    if (!selectedObject || !fabricCanvas) return;
    
    selectedObject.set({
      left: (fabricCanvas.width! / 2) - (selectedObject.width! * selectedObject.scaleX!) / 2
    });
    fabricCanvas.renderAll();
  };

  const resetLayout = () => {
    if (!fabricCanvas) return;
    
    fabricCanvas.clear();
    initializeLabelContent(fabricCanvas);
    toast.success('Layout reset to default');
  };

  const saveChanges = () => {
    if (!fabricCanvas) return;

    // Extract updated data from canvas objects
    const objects = fabricCanvas.getObjects();
    const updatedData = { ...data };

    objects.forEach((obj: any) => {
      if (obj.id === 'mealName' && obj.text) {
        updatedData.mealName = obj.text;
      }
      // Add more field extractions as needed
    });

    onSave(updatedData);
    toast.success('Changes saved successfully');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              Label Editor
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetLayout}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={saveChanges}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close Editor
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Tools Panel */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Tools</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={activeTool === 'select' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTool('select')}
                  >
                    <Move className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={activeTool === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTool('text')}
                  >
                    <Type className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {activeTool === 'text' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="textInput">Add Text</Label>
                    <Input
                      id="textInput"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter text..."
                      onKeyPress={(e) => e.key === 'Enter' && addText()}
                    />
                    <Button size="sm" className="w-full mt-2" onClick={addText}>
                      Add Text
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="fontSize">Font Size</Label>
                    <Input
                      id="fontSize"
                      type="number"
                      min="6"
                      max="72"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="fontWeight">Font Weight</Label>
                    <Select value={fontWeight} onValueChange={setFontWeight}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {selectedObject && selectedObject.type === 'textbox' && (
                <div className="space-y-3 border-t pt-3">
                  <Label className="text-sm font-medium">Selected Text</Label>
                  
                  <div>
                    <Label htmlFor="selectedFontSize">Font Size</Label>
                    <Input
                      id="selectedFontSize"
                      type="number"
                      min="6"
                      max="72"
                      value={selectedObject.fontSize || 12}
                      onChange={(e) => updateSelectedText('fontSize', parseInt(e.target.value) || 12)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="selectedColor">Text Color</Label>
                    <Input
                      id="selectedColor"
                      type="color"
                      value={selectedObject.fill || '#000000'}
                      onChange={(e) => updateSelectedText('fill', e.target.value)}
                    />
                  </div>

                  <Button size="sm" className="w-full" onClick={centerHorizontally}>
                    <AlignCenter className="w-4 h-4 mr-2" />
                    Center Horizontally
                  </Button>
                </div>
              )}
            </div>

            {/* Canvas Area */}
            <div className="lg:col-span-3">
              <div className="border rounded-lg bg-white p-4 flex justify-center">
                <div className="border border-gray-300" style={{
                  width: mmToPx(99.1),
                  height: mmToPx(38.1)
                }}>
                  <canvas 
                    ref={canvasRef}
                    className="border border-gray-200"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Click and drag elements to move them. Double-click text to edit. Use the tools panel to add new elements.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};