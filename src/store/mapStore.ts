import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Priority, PropertyNote, UserPropertyNote, Property } from '../types';
import { apiClient } from '../utils/apiClient';

interface MapState {
  center: [number, number];
  zoom: number;
  userId: string;
  properties: Property[];
  isLoading: boolean;
  error: string | null;
  propertyNotes: UserPropertyNote;
  selectedPropertyId: string | null;
  selectedBaseLayer: string;
  enabledOverlays: string[];
  setMapState: (center: [number, number], zoom: number) => void;
  setPropertyNote: (propertyId: string, note: Partial<PropertyNote>) => void;
  markAsVisited: (propertyId: string) => void;
  setSelectedProperty: (propertyId: string | null) => void;
  resetPropertyNote: (propertyId: string) => void;
  setSelectedBaseLayer: (layerId: string) => void;
  toggleOverlay: (layerId: string) => void;
  fetchProperties: () => Promise<void>;
}

// Temporary user ID for demo purposes
const DEMO_USER_ID = 'user-1';

export const useMapStore = create<MapState>()(
  persist(
    (set, get) => ({
      center: [39.8283, -86.2786],
      zoom: 7,
      userId: DEMO_USER_ID,
      properties: [],
      isLoading: false,
      error: null,
      propertyNotes: {},
      selectedPropertyId: null,
      selectedBaseLayer: 'streets',
      enabledOverlays: [],
      setMapState: (center: [number, number], zoom: number) => 
        set((state) => {
          if (state.center[0] === center[0] && 
              state.center[1] === center[1] && 
              state.zoom === zoom) {
            return state;
          }
          return { center, zoom };
        }),
      setPropertyNote: (propertyId: string, note: Partial<PropertyNote>) =>
        set((state) => {
          const currentNotes = state.propertyNotes[propertyId]?.[state.userId] || {
            priority: null,
            comment: '',
            visited: false,
            userId: state.userId,
            propertyId,
            lastUpdated: new Date().toISOString()
          };

          const newNote = {
            ...currentNotes,
            ...note,
            visited: true,
            lastUpdated: new Date().toISOString()
          };

          if (
            currentNotes.priority === newNote.priority &&
            currentNotes.comment === newNote.comment &&
            currentNotes.visited === newNote.visited
          ) {
            return state;
          }

          return {
            propertyNotes: {
              ...state.propertyNotes,
              [propertyId]: {
                ...state.propertyNotes[propertyId],
                [state.userId]: newNote
              }
            }
          };
        }),
      markAsVisited: (propertyId: string) =>
        set((state) => {
          const currentNote = state.propertyNotes[propertyId]?.[state.userId];
          if (currentNote?.visited) {
            return state;
          }

          return {
            propertyNotes: {
              ...state.propertyNotes,
              [propertyId]: {
                ...state.propertyNotes[propertyId],
                [state.userId]: {
                  ...currentNote || {
                    priority: null,
                    comment: '',
                    userId: state.userId,
                    propertyId,
                    lastUpdated: new Date().toISOString()
                  },
                  visited: true
                }
              }
            }
          };
        }),
      setSelectedProperty: (propertyId: string | null) =>
        set({ selectedPropertyId: propertyId }),
      resetPropertyNote: (propertyId: string) =>
        set((state) => {
          const newPropertyNotes = { ...state.propertyNotes };
          if (newPropertyNotes[propertyId]) {
            delete newPropertyNotes[propertyId][state.userId];
            if (Object.keys(newPropertyNotes[propertyId]).length === 0) {
              delete newPropertyNotes[propertyId];
            }
          }
          return { propertyNotes: newPropertyNotes };
        }),
      setSelectedBaseLayer: (layerId: string) =>
        set({ selectedBaseLayer: layerId }),
      toggleOverlay: (layerId: string) =>
        set((state) => ({
          enabledOverlays: state.enabledOverlays.includes(layerId)
            ? state.enabledOverlays.filter(id => id !== layerId)
            : [...state.enabledOverlays, layerId]
        })),
      fetchProperties: async () => {
        set({ isLoading: true, error: null });
        try {
          const properties = await apiClient.get<Property[]>('/api/properties');
          set({ properties, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch properties',
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'map-storage',
      partialize: (state) => ({
        propertyNotes: state.propertyNotes,
        selectedBaseLayer: state.selectedBaseLayer,
        enabledOverlays: state.enabledOverlays,
      }),
    }
  )
);