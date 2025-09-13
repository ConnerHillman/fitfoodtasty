import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, AlertCircle, Plus, Square, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeliveryZone {
  id: string;
  zone_name: string;
  postcodes: string[];
  postcode_prefixes?: string[];
  delivery_days: string[];
  delivery_fee: number;
  minimum_order: number;
  maximum_distance_km: number | null;
  is_active: boolean;
}

interface DeliveryMapProps {
  deliveryZones: DeliveryZone[];
  onZoneCreated?: (zoneData: Partial<DeliveryZone>) => void;
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({ deliveryZones, onZoneCreated }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [testPostcode, setTestPostcode] = useState('');
  const [testResult, setTestResult] = useState<{ found: boolean; zone?: DeliveryZone } | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMapboxToken();
  }, []);

  useEffect(() => {
    console.log('Mapbox token received:', !!mapboxToken);
    if (mapboxToken && mapContainer.current && !map.current) {
      console.log('Initializing map...');
      initializeMap();
    }
  }, [mapboxToken]);

  const fetchMapboxToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) throw error;
      
      if (data?.token) {
        setMapboxToken(data.token);
      } else {
        throw new Error('No token received');
      }
    } catch (error: any) {
      console.error('Error fetching Mapbox token:', error);
      toast({
        title: "Map Setup Required",
        description: "Please configure Mapbox token in Supabase secrets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapboxToken || !mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-1.5, 53.8], // Centered on UK
      zoom: 6,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      console.log('Map loaded, initializing draw controls...');
      
      // Initialize Mapbox Draw after map loads
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        boxSelect: false,
        controls: {
          polygon: true,
          trash: true
        },
        defaultMode: 'simple_select'
      });
      
      console.log('Draw instance created:', draw.current);
      map.current!.addControl(draw.current, 'top-left');
      console.log('Draw control added to map');

      // Ensure proper sizing when container becomes visible
      try {
        const ro = new ResizeObserver(() => {
          map.current?.resize();
        });
        if (mapContainer.current) ro.observe(mapContainer.current);
      } catch (e) {
        console.warn('ResizeObserver not available', e);
      }

      // Listen for drawing events
      map.current!.on('draw.create', handleDrawCreate);
      map.current!.on('draw.update', handleDrawUpdate);
      map.current!.on('draw.delete', handleDrawDelete);
      map.current!.on('draw.modechange', (e: any) => {
        console.log('Draw mode changed:', e.mode);
        setDrawingInteractions(e.mode === 'draw_polygon');
        setIsDrawingMode(e.mode === 'draw_polygon');
      });
      
      setDrawingInteractions(false);
      addDeliveryZonesToMap();
    });
  };

  // Drawing event handlers
  const handleDrawCreate = async (e: any) => {
    const feature = e.features[0];
    setSelectedArea(feature);
    
    if (feature.geometry.type === 'Polygon') {
      const postcodes = await getPostcodesInPolygon(feature.geometry.coordinates[0]);
      
      if (onZoneCreated && postcodes.length > 0) {
        onZoneCreated({
          zone_name: `Zone ${new Date().toLocaleTimeString()}`,
          postcodes: postcodes,
          delivery_fee: 5.99,
          delivery_days: ['monday', 'wednesday', 'friday'],
          is_active: true
        });
      } else {
        toast({
          title: "No postcodes found",
          description: "No existing postcodes found in the selected area. You can manually add postcodes to this zone.",
          variant: "default",
        });
        
        if (onZoneCreated) {
          onZoneCreated({
            zone_name: `Zone ${new Date().toLocaleTimeString()}`,
            postcodes: [],
            delivery_fee: 5.99,
            delivery_days: ['monday', 'wednesday', 'friday'],
            is_active: true
          });
        }
      }
    }

    // Exit drawing mode and re-enable map interactions
    if (draw.current) {
      draw.current.changeMode('simple_select');
    }
    setIsDrawingMode(false);
    setDrawingInteractions(false);
  };

  const handleDrawUpdate = (e: any) => {
    const feature = e.features[0];
    setSelectedArea(feature);
  };

  const handleDrawDelete = () => {
    setSelectedArea(null);
    setIsDrawingMode(false);
    setDrawingInteractions(false);
  };

  // Only disable interactions when actively drawing
  const setDrawingInteractions = (enableDrawing: boolean) => {
    if (!map.current) return;
    const m = map.current;
    if (enableDrawing) {
      m.dragPan.disable();
      m.scrollZoom.disable();
      m.getCanvas().style.cursor = 'crosshair';
    } else {
      m.dragPan.enable();
      m.scrollZoom.enable();
      m.getCanvas().style.cursor = '';
    }
  };

  const toggleDrawingMode = () => {
    console.log('Toggle drawing mode called, current mode:', isDrawingMode);
    console.log('Draw instance:', draw.current);
    
    if (draw.current) {
      if (isDrawingMode) {
        console.log('Switching to simple_select mode');
        draw.current.changeMode('simple_select');
        setDrawingInteractions(false);
        setIsDrawingMode(false);
      } else {
        console.log('Switching to draw_polygon mode');
        map.current?.resize();
        setDrawingInteractions(true);
        draw.current.changeMode('draw_polygon');
        setIsDrawingMode(true);
      }
    } else {
      console.error('Draw instance is null!');
    }
  };

  const getPostcodesInPolygon = async (coordinates: number[][]): Promise<string[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('find-postcodes-in-polygon', {
        body: { coordinates }
      });
      
      if (error) {
        console.error('Error finding postcodes:', error);
        throw error;
      }
      
      console.log('Postcodes found in polygon:', data?.count || 0);
      return data?.postcodes || [];
    } catch (error) {
      console.error('Failed to find postcodes in polygon:', error);
      return [];
    }
  };

  const isPointInPolygon = (point: [number, number], polygon: number[][]): boolean => {
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  };

  const addDeliveryZonesToMap = async () => {
    if (!map.current) return;

    // Add markers for each delivery zone's postcodes
    for (const zone of deliveryZones) {
      if (!zone.is_active) continue;

      // Process exact postcodes
      for (const postcode of zone.postcodes) {
        try {
          const coordinates = await geocodePostcode(postcode);
          if (coordinates) {
            addZoneMarker(coordinates, zone, postcode);
          }
        } catch (error) {
          console.warn(`Failed to geocode postcode: ${postcode}`, error);
        }
      }

      // Process postcode prefixes (show approximate center)
      for (const prefix of zone.postcode_prefixes || []) {
        try {
          const coordinates = await geocodePostcode(prefix);
          if (coordinates) {
            addZoneMarker(coordinates, zone, `${prefix}*`, true);
          }
        } catch (error) {
          console.warn(`Failed to geocode postcode prefix: ${prefix}`, error);
        }
      }
    }
  };

  const geocodePostcode = async (postcode: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(postcode)}.json?country=GB&types=postcode&access_token=${mapboxToken}`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        return data.features[0].center;
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const addZoneMarker = (
    coordinates: [number, number], 
    zone: DeliveryZone, 
    postcode: string,
    isPrefix: boolean = false
  ) => {
    if (!map.current) return;

    const el = document.createElement('div');
    el.className = 'delivery-zone-marker';
    el.style.cssText = `
      background-color: ${isPrefix ? '#f97316' : '#3b82f6'};
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      cursor: pointer;
    `;

    const popup = new mapboxgl.Popup({
      offset: 15,
      closeButton: true,
      closeOnClick: false
    }).setHTML(`
      <div class="p-2">
        <h4 class="font-semibold text-sm">${zone.zone_name}</h4>
        <p class="text-xs text-gray-600">${postcode} ${isPrefix ? '(Prefix)' : ''}</p>
        <div class="mt-1 text-xs">
          <div>Fee: £${zone.delivery_fee}</div>
          <div>Min Order: £${zone.minimum_order}</div>
          <div>Days: ${zone.delivery_days.join(', ')}</div>
        </div>
      </div>
    `);

    new mapboxgl.Marker(el)
      .setLngLat(coordinates)
      .setPopup(popup)
      .addTo(map.current);
  };

  const testPostcodeDelivery = async () => {
    if (!testPostcode.trim()) return;

    const normalizedPostcode = testPostcode.trim().toUpperCase();
    
    // Find matching zone
    const matchingZone = deliveryZones.find(zone => 
      zone.is_active && (
        zone.postcodes.some(pc => pc.toUpperCase() === normalizedPostcode) ||
        zone.postcode_prefixes?.some(prefix => normalizedPostcode.startsWith(prefix.toUpperCase()))
      )
    );

    if (matchingZone) {
      setTestResult({ found: true, zone: matchingZone });
      
      // Try to center map on this postcode
      try {
        const coordinates = await geocodePostcode(normalizedPostcode);
        if (coordinates && map.current) {
          map.current.flyTo({ center: coordinates, zoom: 12 });
        }
      } catch (error) {
        console.warn('Failed to center map on postcode');
      }
    } else {
      setTestResult({ found: false });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mapboxToken) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="font-semibold">Map Configuration Required</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Please configure your Mapbox token in Supabase Edge Function Secrets to view delivery zones on the map.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Get your token from <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Delivery Zones Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Exact Postcodes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>Postcode Prefixes</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={toggleDrawingMode}
                  variant={isDrawingMode ? "destructive" : "outline"}
                  size="sm"
                >
                  {isDrawingMode ? (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Drawing
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Draw New Zone
                    </>
                  )}
                </Button>
                {selectedArea && (
                  <Button 
                    onClick={() => {
                      draw.current?.delete(selectedArea.id);
                      setSelectedArea(null);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Clear Selection
                  </Button>
                )}
              </div>
            </div>
            
            <div className="h-96 w-full rounded-lg overflow-hidden border">
              <div ref={mapContainer} className="w-full h-full" />
            </div>

            {selectedArea && (
              <div className="p-3 rounded-lg border bg-primary/10 border-primary/20">
                <div className="text-sm font-medium mb-2">Zone Selection Active</div>
                <p className="text-sm opacity-90">
                  Draw a polygon on the map to define a new delivery zone. 
                  The system will automatically detect postcodes within the selected area.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Postcode Delivery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="test-postcode">Enter postcode to test</Label>
                <Input
                  id="test-postcode"
                  value={testPostcode}
                  onChange={(e) => setTestPostcode(e.target.value)}
                  placeholder="e.g., SW1A 1AA"
                  onKeyPress={(e) => e.key === 'Enter' && testPostcodeDelivery()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={testPostcodeDelivery}>Test</Button>
              </div>
            </div>
            
            {testResult && (
              <div className={`p-3 rounded-lg border ${
                testResult.found 
                  ? 'bg-success/10 border-success/20 text-success-foreground' 
                  : 'bg-destructive/10 border-destructive/20 text-destructive-foreground'
              }`}>
                <div className="flex items-center gap-2">
                  {testResult.found ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                  <span className="font-medium">
                    {testResult.found 
                      ? `✓ Delivery available in ${testResult.zone?.zone_name}` 
                      : '✗ No delivery available for this postcode'
                    }
                  </span>
                </div>
                {testResult.found && testResult.zone && (
                  <div className="mt-2 text-sm opacity-90">
                    Delivery fee: £{testResult.zone.delivery_fee} | 
                    Days: {testResult.zone.delivery_days.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryMap;