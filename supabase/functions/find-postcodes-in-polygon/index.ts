import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PostcodeResult {
  postcode: string;
  longitude: number;
  latitude: number;
  admin_district?: string;
  admin_county?: string;
}

// Check if a point is inside a polygon using ray casting algorithm
function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
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
}

// Get bounding box from polygon coordinates
function getBoundingBox(coordinates: number[][]): [number, number, number, number] {
  let minLon = coordinates[0][0];
  let maxLon = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLat = coordinates[0][1];
  
  for (const coord of coordinates) {
    minLon = Math.min(minLon, coord[0]);
    maxLon = Math.max(maxLon, coord[0]);
    minLat = Math.min(minLat, coord[1]);
    maxLat = Math.max(maxLat, coord[1]);
  }
  
  return [minLon, minLat, maxLon, maxLat];
}

// Query postcodes.io for postcodes in bounding box area
async function findPostcodesInArea(minLon: number, minLat: number, maxLon: number, maxLat: number): Promise<PostcodeResult[]> {
  const postcodes: PostcodeResult[] = [];
  
  // Grid search approach - sample points across the bounding box
  const lonStep = (maxLon - minLon) / 10; // 10x10 grid
  const latStep = (maxLat - minLat) / 10;
  
  const promises: Promise<void>[] = [];
  
  for (let lon = minLon; lon <= maxLon; lon += lonStep) {
    for (let lat = minLat; lat <= maxLat; lat += latStep) {
      const promise = (async () => {
        try {
          const response = await fetch(
            `https://api.postcodes.io/postcodes?lon=${lon}&lat=${lat}&radius=2000&limit=100`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.result) {
              for (const postcode of data.result) {
                postcodes.push({
                  postcode: postcode.postcode,
                  longitude: postcode.longitude,
                  latitude: postcode.latitude,
                  admin_district: postcode.admin_district,
                  admin_county: postcode.admin_county
                });
              }
            }
          }
        } catch (error) {
          console.warn('Error fetching postcodes for point:', lon, lat, error);
        }
      })();
      
      promises.push(promise);
    }
  }
  
  await Promise.all(promises);
  
  // Remove duplicates
  const uniquePostcodes = postcodes.filter((postcode, index, self) => 
    index === self.findIndex(p => p.postcode === postcode.postcode)
  );
  
  return uniquePostcodes;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { coordinates } = await req.json();
    
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Invalid polygon coordinates provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Finding postcodes in polygon with', coordinates.length, 'vertices');
    
    // Get bounding box
    const [minLon, minLat, maxLon, maxLat] = getBoundingBox(coordinates);
    console.log('Bounding box:', { minLon, minLat, maxLon, maxLat });
    
    // Find postcodes in the area
    const areaPostcodes = await findPostcodesInArea(minLon, minLat, maxLon, maxLat);
    console.log('Found', areaPostcodes.length, 'postcodes in bounding area');
    
    // Filter postcodes that are actually inside the polygon
    const postcodesInPolygon = areaPostcodes.filter(postcode => 
      isPointInPolygon([postcode.longitude, postcode.latitude], coordinates)
    );
    
    console.log('Filtered to', postcodesInPolygon.length, 'postcodes inside polygon');
    
    // Extract just the postcode strings
    const postcodeList = postcodesInPolygon.map(p => p.postcode);
    
    return new Response(
      JSON.stringify({ 
        postcodes: postcodeList,
        count: postcodeList.length,
        details: postcodesInPolygon
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error finding postcodes:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to find postcodes in polygon' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});