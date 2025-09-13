import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, AlertCircle } from 'lucide-react';
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
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({ deliveryZones }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [testPostcode, setTestPostcode] = useState('');
  const [testResult, setTestResult] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchMapboxToken();
  }, []);

  useEffect(() => {
    if (mapboxToken && mapContainer.current && !map.current) {
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
      addDeliveryZonesToMap();
    });
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
      setTestResult(`✓ Delivery available in ${matchingZone.zone_name} - Fee: £${matchingZone.delivery_fee}, Min Order: £${matchingZone.minimum_order}`);
      
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
      setTestResult(`✗ No delivery available to ${normalizedPostcode}`);
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Exact Postcodes</span>
              <div className="w-3 h-3 rounded-full bg-orange-500 ml-4"></div>
              <span>Postcode Prefixes</span>
            </div>
            
            <div className="h-96 w-full rounded-lg overflow-hidden border">
              <div ref={mapContainer} className="w-full h-full" />
            </div>
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
              <div className={`p-3 rounded-md text-sm ${
                testResult.startsWith('✓') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {testResult}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryMap;