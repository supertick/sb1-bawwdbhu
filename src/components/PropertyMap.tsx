import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Property, Priority, PropertyNote } from '../types';
import { Icon } from 'leaflet';
import { useMapStore } from '../store/mapStore';
import { MapPin, Home, Calendar, User, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Select, MenuItem, TextField, FormControl, InputLabel, Button, IconButton, Tooltip, Link } from '@mui/material';
import MapLayers from './MapLayers';

const createColoredIcon = (color: string) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 41">
      <path fill="${color}" stroke="#000" stroke-width="1" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    </svg>
  `)}`,
  iconSize: [24, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -34],
});

const markerIcons = {
  high: createColoredIcon('#ef4444'),    // Red
  medium: createColoredIcon('#eab308'),  // Yellow
  low: createColoredIcon('#9ca3af'),     // Grey
  unvisited: createColoredIcon('#4b5563') // Grey (was blue)
};

interface MapControllerProps {
  properties: Property[];
  markersRef: React.MutableRefObject<{ [key: string]: L.Marker }>;
}

const MapController: React.FC<MapControllerProps> = ({ properties, markersRef }) => {
  const map = useMap();
  const { setMapState, selectedPropertyId, setSelectedProperty } = useMapStore();

  const updateMapState = useCallback(() => {
    const center = map.getCenter();
    setMapState([center.lat, center.lng], map.getZoom());
  }, [map, setMapState]);

  useEffect(() => {
    map.on('moveend', updateMapState);
    map.on('zoomend', updateMapState);

    return () => {
      map.off('moveend', updateMapState);
      map.off('zoomend', updateMapState);
    };
  }, [map, updateMapState]);

  useEffect(() => {
    if (selectedPropertyId) {
      const property = properties.find(p => p.propertyID === selectedPropertyId);
      if (property && property.latitude && property.longitude) {
        map.setView([property.latitude, property.longitude], map.getZoom());
        const marker = markersRef.current[selectedPropertyId];
        if (marker) {
          marker.openPopup();
        }
      }
    }
  }, [selectedPropertyId, properties, map, markersRef]);

  return null;
};

interface PropertyMapProps {
  properties: Property[];
}

const PropertyMap: React.FC<PropertyMapProps> = ({ properties }) => {
  const { center, zoom, propertyNotes, userId, setPropertyNote, markAsVisited, selectedPropertyId, resetPropertyNote } = useMapStore();
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const [expandedPopups, setExpandedPopups] = useState<{ [key: string]: boolean }>({});
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: { priority: Priority | null; comment: string } }>({});
  
  const handlePriorityChange = useCallback((propertyId: string, newPriority: Priority) => {
    setEditingNotes(prev => ({
      ...prev,
      [propertyId]: {
        ...prev[propertyId] || { 
          priority: propertyNotes[propertyId]?.[userId]?.priority || null,
          comment: propertyNotes[propertyId]?.[userId]?.comment || ''
        },
        priority: newPriority
      }
    }));
  }, [propertyNotes, userId]);

  const handleCommentChange = useCallback((propertyId: string, newComment: string) => {
    setEditingNotes(prev => ({
      ...prev,
      [propertyId]: {
        ...prev[propertyId] || {
          priority: propertyNotes[propertyId]?.[userId]?.priority || null,
          comment: propertyNotes[propertyId]?.[userId]?.comment || ''
        },
        comment: newComment
      }
    }));
  }, [propertyNotes, userId]);

  const handleSave = useCallback((propertyId: string) => {
    const editedNote = editingNotes[propertyId];
    if (editedNote) {
      setPropertyNote(propertyId, editedNote);
      setEditingNotes(prev => {
        const newState = { ...prev };
        delete newState[propertyId];
        return newState;
      });
    }
  }, [editingNotes, setPropertyNote]);

  const handleCancel = useCallback((propertyId: string) => {
    setEditingNotes(prev => {
      const newState = { ...prev };
      delete newState[propertyId];
      return newState;
    });
  }, []);

  const togglePopupExpansion = useCallback((propertyId: string) => {
    setExpandedPopups(prev => ({
      ...prev,
      [propertyId]: !prev[propertyId]
    }));
  }, []);

  const handleReset = useCallback((propertyId: string) => {
    resetPropertyNote(propertyId);
    setEditingNotes(prev => {
      const newState = { ...prev };
      delete newState[propertyId];
      return newState;
    });
  }, [resetPropertyNote]);
  
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
    >
      <MapController properties={properties || []} markersRef={markersRef} />
      <MapLayers />
      {Array.isArray(properties) && properties.map((property) => {
        if (!property?.latitude || !property?.longitude) return null;
        
        const note = propertyNotes[property.propertyID]?.[userId];
        const editingNote = editingNotes[property.propertyID];
        const icon = note?.visited && note?.priority ? markerIcons[note.priority] : markerIcons.unvisited;
        const isExpanded = expandedPopups[property.propertyID];
        
        return (
          <Marker
            key={property.saleID}
            position={[property.latitude, property.longitude]}
            icon={icon}
            ref={(ref) => {
              if (ref) {
                markersRef.current[property.propertyID] = ref;
              }
            }}
            eventHandlers={{
              popupopen: () => {
                if (!note?.visited) {
                  markAsVisited(property.propertyID);
                }
              }
            }}
          >
            <Popup className="property-popup" maxWidth={400}>
              <div className="flex flex-col gap-2 min-w-[300px]">
                <img
                  src="https://beacon.schneidercorp.com/BeaconData/BeaconTemp/C-99-2ba7aef2e0b94686a05306dc8fe944e6.png"
                  alt={property.propertyStreet}
                  className="w-full h-[200px] object-cover rounded-lg"
                />
                
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{property.propertyStreet}</h3>
                      <p className="text-sm text-gray-600">{property.propertyCity}, {property.propertyZip}</p>
                      <Link
                        href={`https://beacon.schneidercorp.com/Application.aspx?AppID=99&LayerID=962&PageTypeID=4&PageID=611&Q=766879730&KeyValue=${property.propertyID}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {property.propertyID}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tooltip title="Reset property">
                        <IconButton
                          size="small"
                          onClick={() => handleReset(property.propertyID)}
                          sx={{ color: 'text.secondary' }}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </IconButton>
                      </Tooltip>
                      <Button
                        size="small"
                        onClick={() => togglePopupExpansion(property.propertyID)}
                        startIcon={isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      >
                        {isExpanded ? 'Show Less' : 'Show More'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span>{property.saleDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{property.minimumBid}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <span>{property.saleLocation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="truncate" title={property.ownerName}>
                        {property.ownerName}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 space-y-2 border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">County</span>
                        <span className="text-sm">{property.county}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">Sale ID</span>
                        <span className="text-sm">{property.saleID}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Legal Description</span>
                        <p className="text-sm mt-1">{property.legal}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                    <FormControl fullWidth size="small">
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={editingNote?.priority || note?.priority || ''}
                        label="Priority"
                        onChange={(e) => handlePriorityChange(property.propertyID, e.target.value as Priority)}
                        sx={{
                          '& .MuiSelect-select': {
                            color: editingNote?.priority === 'high' || note?.priority === 'high' ? '#ef4444' :
                                   editingNote?.priority === 'medium' || note?.priority === 'medium' ? '#eab308' :
                                   editingNote?.priority === 'low' || note?.priority === 'low' ? '#9ca3af' : 'inherit'
                          }
                        }}
                      >
                        <MenuItem value="high" sx={{ color: '#ef4444' }}>High Priority</MenuItem>
                        <MenuItem value="medium" sx={{ color: '#eab308' }}>Medium Priority</MenuItem>
                        <MenuItem value="low" sx={{ color: '#9ca3af' }}>Low Priority</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      size="small"
                      label="Notes"
                      multiline
                      rows={2}
                      value={editingNote?.comment || note?.comment || ''}
                      onChange={(e) => handleCommentChange(property.propertyID, e.target.value)}
                    />

                    <div className="flex justify-end gap-2">
                      <Button
                        size="small"
                        onClick={() => handleCancel(property.propertyID)}
                        variant="outlined"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleSave(property.propertyID)}
                        variant="contained"
                      >
                        Update
                      </Button>
                    </div>

                    <div className="text-xs text-gray-500">
                      {note?.lastUpdated && (
                        <p>Last updated: {new Date(note.lastUpdated).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default PropertyMap;