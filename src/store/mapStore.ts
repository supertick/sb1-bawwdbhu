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
  setPropertyNote: (propertyId: string, note: Partial<PropertyNote>) => Promise<void>;
  markAsVisited: (propertyId: string) => void;
  setSelectedProperty: (propertyId: string | null) => void;
  resetPropertyNote: (propertyId: string) => Promise<void>;
  setSelectedBaseLayer: (layerId: string) => void;
  toggleOverlay: (layerId: string) => void;
  fetchProperties: () => Promise<void>;
}

// Temporary user ID for demo purposes
const DEMO_USER_ID = 'greg@cloudseeder.com';

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
      setPropertyNote: async (propertyId: string, note: Partial<PropertyNote>) => {
        const state = get();
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
          lastUpdated: new Date().toISOString()
        };

        // Only update if there are actual changes
        if (
          currentNotes.priority === newNote.priority &&
          currentNotes.comment === newNote.comment &&
          currentNotes.visited === newNote.visited
        ) {
          return;
        }

        try {
          // Format the data according to the API requirements
          const apiPayload = {
            id: `${propertyId}|${state.userId}`,
            property_id: propertyId,
            user_id: state.userId,
            priority: newNote.priority,
            comment: newNote.comment,
            updated_at: Date.now(),
            visited: newNote.visited
          };

          await apiClient.put(`/property-note/${propertyId}|${state.userId}`, apiPayload);

          // Update local state after successful API call
          set({
            propertyNotes: {
              ...state.propertyNotes,
              [propertyId]: {
                ...state.propertyNotes[propertyId],
                [state.userId]: newNote
              }
            }
          });
        } catch (error) {
          // Error is handled by apiClient
          console.error(error)
          // throw error;
        }
      },
      markAsVisited: (propertyId: string) =>
        set((state) => {
          const currentNote = state.propertyNotes[propertyId]?.[state.userId];
          if (currentNote?.visited) {
            return state;
          }

          const newNote = {
            ...currentNote || {
              priority: null,
              comment: '',
              userId: state.userId,
              propertyId,
              lastUpdated: new Date().toISOString()
            },
            visited: true
          };

          // Update the API using PUT instead of POST
          const apiPayload = {
            id: `${propertyId}|${state.userId}`,
            property_id: propertyId,
            user_id: state.userId,
            priority: newNote.priority,
            comment: newNote.comment,
            updated_at: Date.now(),
            visited: true
          };

          apiClient.post('/property-note', apiPayload).catch(error => {
            console.error('Failed to mark property as visited:', error);
          });

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
      setSelectedProperty: (propertyId: string | null) =>
        set({ selectedPropertyId: propertyId }),
      resetPropertyNote: async (propertyId: string) => {
        const state = get();
        try {
          // Send delete request to server with the correct ID format
          await apiClient.delete(`/property-note/${propertyId}|${state.userId}`);

          // Update local state after successful API call
          set((state) => {
            const newPropertyNotes = { ...state.propertyNotes };
            if (newPropertyNotes[propertyId]) {
              delete newPropertyNotes[propertyId][state.userId];
              if (Object.keys(newPropertyNotes[propertyId]).length === 0) {
                delete newPropertyNotes[propertyId];
              }
            }
            return { propertyNotes: newPropertyNotes };
          });
        } catch (error) {
          // Error is handled by apiClient
          throw error;
        }
      },
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
          const properties = await apiClient.get<Property[]>('/sri-data-list');
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