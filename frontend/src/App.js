// src/App.js

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';


// --- UTILITY: A component to fix map resize issues ---
const MapResizeFix = () => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
};

// --- ROUTING COMPONENT: Draws a route on the map using Leaflet Routing Machine ---
const RoutingMachine = ({ waypoints }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || waypoints.length < 2) return;

    const control = L.Routing.control({
      waypoints: waypoints.map(([lat, lng]) => L.latLng(lat, lng)),
      lineOptions: {
        styles: [{ color: "blue", weight: 5, opacity: 0.7 }],
      },
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1/",
      }),
      show: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
    }).addTo(map);

    // ✅ Safe cleanup
    return () => {
      if (map && control) {
        try {
          control.getPlan().setWaypoints([]); // clear waypoints
          control.remove(); // remove from map safely
        } catch (err) {
          console.warn("Routing control cleanup issue:", err);
        }
      }
    };
  }, [map, waypoints]);

  return null;
};


// --- UTILITY: Gets an emoji icon based on category ---
const getCategoryIcon = (categories) => {
  const category = categories[0]?.toLowerCase() || '';
  if (category.includes('coffee') || category.includes('café')) return '☕️';
  if (category.includes('park') || category.includes('garden')) return '🌳';
  if (category.includes('pizza') || category.includes('restaurant')) return '🍕';
  if (category.includes('museum') || category.includes('art')) return '🎨';
  if (category.includes('bar') || category.includes('lounge')) return '🍸';
  if (category.includes('tea')) return '🍵';
  return '📍'; // Default icon
};

// --- FIX: Corrects Leaflet's default icon path issue with Webpack ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// --- UTILITY: Creates a custom emoji icon for the map markers ---
const createCustomIcon = (emoji) => {
  return L.divIcon({
    html: `<span style="font-size: 24px;">${emoji}</span>`,
    className: 'bg-transparent border-0',
    iconSize: [30, 42],
    iconAnchor: [15, 42],
  });
};


function App() {
  // --- STATE MANAGEMENT ---
  const [location, setLocation] = useState(null);
  const [query, setQuery] = useState('coffee');
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walkRoute, setWalkRoute] = useState([]);
  const mapRef = useRef(null);

  // --- HOOKS ---
  // Get user's location on initial component load
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setIsLoading(false);
      },
      () => {
        setError('Location access denied. Using fallback (Mumbai).');
        setLocation({ lat: 19.0760, lng: 72.8777 });
        setIsLoading(false);
      }
    );
  }, []);

  // --- DATA FETCHING ---
  const fetchPlaces = async (e) => {
    if (e) e.preventDefault();
    if (!location) return;

    setIsLoading(true);
    setError(null);
    setPlaces([]);

    try {
      const url = new URL('http://127.0.0.1:8000/search');
      url.searchParams.append('query', query);
      url.searchParams.append('ll', `${location.lat},${location.lng}`);
      url.searchParams.append('radius', 5000);
      url.searchParams.append('limit', 15);
      url.searchParams.append('sort', 'distance');

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch places.');
      
      const data = await response.json();
      setPlaces(data.results || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- EVENT HANDLERS ---
  const handleCardClick = (place) => {
    const lat = place.latitude;
    const lon = place.longitude;
    //const lat = place.geocodes?.main?.latitude;
    //const lon = place.geocodes?.main?.longitude;

    if (lat && lon && mapRef.current) {
      mapRef.current.flyTo([lat, lon], 16);
    }
  };

  const handleAddToWalk = (place) => {
    setWalkRoute((prevRoute) => [...prevRoute, place]);
  };
  
  const handleRemoveFromWalk = (place) => {
    const placeIdentifier = place.id || `${place.name}-${place.distance}`;
    setWalkRoute((prevRoute) => prevRoute.filter((p) => (p.id || `${p.name}-${p.distance}`) !== placeIdentifier));
  };
  
  // --- DERIVED STATE ---
  // Calculate positions for the Polyline, filtering for valid coordinates
  // --- DERIVED STATE ---
// Build the walk route with start → selected stops → back to start
const routePositions = [];

if (location) {
  // Start at user's location
  routePositions.push([location.lat, location.lng]);

  // Add each walk stop
  walkRoute.forEach((place) => {
    if (place.latitude && place.longitude) {
      routePositions.push([place.latitude, place.longitude]);
    }
  });

  // Return to user's location if there’s at least one stop
  if (walkRoute.length > 0) {
    routePositions.push([location.lat, location.lng]);
  }
}

console.log("Route positions to draw:", routePositions);


  // --- RENDER ---
  return (
    <div className="flex flex-col md:flex-row h-screen font-sans">
      {/* Left Panel: Controls and Results */}
      <div className="w-full md:w-1/3 lg:w-1/4 p-4 bg-white shadow-lg overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">WalkBuddy</h1>
        <p className="text-gray-600 mb-4">Discover places for your next walk</p>

        <form onSubmit={fetchPlaces} className="mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., park, museum, tea"
          />
          <button
            type="submit"
            className="w-full mt-2 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            disabled={isLoading || !location}
          >
            {isLoading ? 'Searching...' : 'Find Places'}
          </button>
        </form>

        {/* Display the current walk route */}
        {walkRoute.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="font-bold text-blue-800">Your Walk ({walkRoute.length} stops)</h2>
            <ol className="list-decimal list-inside mt-2 text-sm text-blue-700">
              {walkRoute.map(p => <li key={p.id || `${p.name}-${p.distance}`}>{p.name}</li>)}
            </ol>
            <button 
              onClick={() => setWalkRoute([])}
              className="text-xs text-red-500 hover:underline mt-2"
            >
              Clear Walk
            </button>
          </div>
        )}

        {error && <p className="text-red-500 text-center">{error}</p>}

        {/* Display the list of fetched places */}
        <div className="space-y-3">
          {places.map((place) => {
            const placeIdentifier = place.id || `${place.name}-${place.distance}`;
            const isInWalk = walkRoute.some(p => (p.id || `${p.name}-${p.distance}`) === placeIdentifier);
            
            return (
              <div 
                key={placeIdentifier}
                className={`p-3 border rounded-lg hover:shadow-md hover:border-blue-400 transition-all ${isInWalk ? 'border-blue-500 border-2' : ''}`}
              >
                <div onClick={() => handleCardClick(place)} className="cursor-pointer">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3 mt-1">{getCategoryIcon(place.categories)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{place.name}</h3>
                      <p className="text-gray-600 text-sm">{place.categories.join(', ')}</p>
                      <p className="text-gray-500 text-xs mt-1">{place.location.formatted_address}</p>
                      <p className="text-blue-600 font-medium text-sm mt-1">~{place.distance}m away</p>
                    </div>
                  </div>
                </div>
                <div className="text-right mt-2">
                  {isInWalk ? (
                    <button 
                      onClick={() => handleRemoveFromWalk(place)}
                      className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded"
                    >
                      Remove from Walk
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleAddToWalk(place)}
                      className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded"
                    >
                      + Add to Walk
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel: Map */}
      <div className="flex-1">
        {location ? (
          <MapContainer ref={mapRef} center={[location.lat, location.lng]} zoom={14} className="h-full w-full">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapResizeFix />
            <Marker position={[location.lat, location.lng]}>
              <Popup>You are here!</Popup>
            </Marker>
            
            {places.map((place) => {
              const lat = place.latitude;
              const lon = place.longitude;

              if (lat && lon) {
                return (
                  <Marker 
                    key={place.id || `${place.name}-${place.distance}`} 
                    position={[lat, lon]}
                    icon={createCustomIcon(getCategoryIcon(place.categories))}
                  >
                    <Popup>{place.name}</Popup>
                  </Marker>
                );
              }
              return null;
            })}

            {routePositions.length > 1 && (
              //<Polyline positions={routePositions} color="blue" weight={5} opacity={0.7} />
              <RoutingMachine waypoints={routePositions} />
            )}
          </MapContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-200">
            <p className="text-gray-600">Getting your location...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;