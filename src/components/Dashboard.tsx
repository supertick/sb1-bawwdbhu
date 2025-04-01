import React, { useState, useEffect } from 'react';
import { Box, Container, ToggleButton, ToggleButtonGroup, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, Avatar, Divider, ListItemButton, CircularProgress, Button } from '@mui/material';
import { MapPin, Table as TableIcon, LogOut, Calendar, Search, Filter, Navigation, CheckCircle2, Circle, Layers } from 'lucide-react';
import PropertyMap from './PropertyMap';
import PropertyTable from './PropertyTable';
import { Property } from '../types';
import { useMapStore } from '../store/mapStore';

const DRAWER_WIDTH = 240;

const Dashboard = () => {
  const [view, setView] = useState<'map' | 'table'>('map');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const { 
    propertyNotes, 
    userId, 
    setPropertyNote, 
    setSelectedProperty,
    properties,
    isLoading,
    error,
    fetchProperties
  } = useMapStore();

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: 'map' | 'table' | null
  ) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  const handleLogout = () => {
    // Implement logout logic here
    console.log('Logout clicked');
  };

  const handlePropertyClick = (propertyId: string) => {
    setSelectedProperty(propertyId);
  };

  // Initialize with empty arrays
  const initialAcc = { visitedProperties: [] as Property[], unvisitedProperties: [] as Property[] };

  // Separate properties into visited and unvisited, with null check
  const { visitedProperties, unvisitedProperties } = Array.isArray(properties) 
    ? properties.reduce(
        (acc, property) => {
          const note = propertyNotes[property.propertyID]?.[userId];
          if (note?.visited) {
            acc.visitedProperties.push(property);
          } else {
            acc.unvisitedProperties.push(property);
          }
          return acc;
        },
        initialAcc
      )
    : initialAcc;

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Typography color="error" variant="h6">
          Error loading properties
        </Typography>
        <Typography color="text.secondary">
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => fetchProperties()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Top AppBar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapPin className="w-6 h-6" />
            PropertyScout.AI
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>U</Avatar>
            <IconButton color="inherit" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box component="main" sx={{ 
        flexGrow: 1, 
        width: `calc(100% - ${DRAWER_WIDTH}px)`,
        marginLeft: 0,
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Toolbar /> {/* Spacer for AppBar */}
        <Box sx={{ 
          flex: 1,
          bgcolor: 'background.paper',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {view === 'map' ? (
            <PropertyMap properties={properties || []} />
          ) : (
            <PropertyTable properties={properties || []} />
          )}
        </Box>
      </Box>

      {/* Right Drawer */}
      <Drawer
        variant="permanent"
        anchor="right"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {/* View Toggle */}
            <ListItem sx={{ justifyContent: 'center', py: 2 }}>
              <ToggleButtonGroup
                value={view}
                exclusive
                onChange={handleViewChange}
                aria-label="view mode"
                size="small"
                orientation="vertical"
                sx={{
                  '& .MuiToggleButton-root': {
                    px: 3,
                    py: 1,
                    width: '100%',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="map" aria-label="map view">
                  <MapPin className="w-5 h-5 mr-2" />
                  Map View
                </ToggleButton>
                <ToggleButton value="table" aria-label="table view">
                  <TableIcon className="w-5 h-5 mr-2" />
                  Table View
                </ToggleButton>
              </ToggleButtonGroup>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <Calendar className="w-5 h-5" />
              </ListItemIcon>
              <ListItemText primary="Auction Calendar" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Navigation className="w-5 h-5" />
              </ListItemIcon>
              <ListItemText primary="Driving Route" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Layers className="w-5 h-5" />
              </ListItemIcon>
              <ListItemText primary="Map Layers" />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <Search className="w-5 h-5" />
              </ListItemIcon>
              <ListItemText primary="Search" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Filter className="w-5 h-5" />
              </ListItemIcon>
              <ListItemText primary="Filters" />
            </ListItem>
            <Divider />
            
            {/* Property Lists */}
            <ListItem>
              <Typography variant="subtitle2" color="text.secondary">
                Unvisited Properties ({unvisitedProperties.length})
              </Typography>
            </ListItem>
            {unvisitedProperties.map((property) => (
              <ListItemButton 
                key={property.propertyID}
                dense
                sx={{ pl: 2 }}
                onClick={() => handlePropertyClick(property.propertyID)}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Circle className="w-4 h-4" />
                </ListItemIcon>
                <ListItemText 
                  primary={property.propertyStreet}
                  secondary={property.propertyCity}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItemButton>
            ))}
            
            <ListItem>
              <Typography variant="subtitle2" color="text.secondary">
                Visited Properties ({visitedProperties.length})
              </Typography>
            </ListItem>
            {visitedProperties.map((property) => {
              const note = propertyNotes[property.propertyID]?.[userId];
              return (
                <ListItemButton 
                  key={property.propertyID}
                  dense
                  sx={{ pl: 2 }}
                  onClick={() => handlePropertyClick(property.propertyID)}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle2 
                      className="w-4 h-4"
                      style={{ 
                        color: note?.priority === 'high' ? '#ef4444' :
                               note?.priority === 'medium' ? '#eab308' :
                               note?.priority === 'low' ? '#9ca3af' : '#4b5563'
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText 
                    primary={property.propertyStreet}
                    secondary={
                      <>
                        {property.propertyCity}
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          Last updated: {new Date(note?.lastUpdated || '').toLocaleDateString()}
                        </Typography>
                      </>
                    }
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Dashboard;