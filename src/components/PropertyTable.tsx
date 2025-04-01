import React, { useState } from 'react';
import { DataGrid, GridColDef, GridColumnVisibilityModel } from '@mui/x-data-grid';
import { Property } from '../types';
import { useMapStore } from '../store/mapStore';
import { Select, MenuItem, TextField, Button, Menu, Checkbox, FormControlLabel, Box, Link } from '@mui/material';
import { Eye } from 'lucide-react';

interface PropertyTableProps {
  properties: Property[];
}

const PropertyTable: React.FC<PropertyTableProps> = ({ properties }) => {
  const { propertyNotes, userId, setPropertyNote } = useMapStore();
  const [columnVisibility, setColumnVisibility] = useState<GridColumnVisibilityModel>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const columns: GridColDef[] = [
    { field: 'saleID', headerName: 'Sale ID', width: 130 },
    { field: 'propertyStreet', headerName: 'Address', width: 200 },
    { field: 'propertyCity', headerName: 'City', width: 130 },
    { field: 'propertyZip', headerName: 'ZIP', width: 100 },
    { 
      field: 'propertyID', 
      headerName: 'Parcel #', 
      width: 200,
      renderCell: (params) => (
        <Link 
          href={`https://beacon.schneidercorp.com/Application.aspx?AppID=99&LayerID=962&PageTypeID=4&PageID=611&Q=766879730&KeyValue=${params.value}`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ 
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          {params.value}
        </Link>
      )
    },
    {
      field: 'saleDate',
      headerName: 'Sale Date',
      width: 130,
    },
    {
      field: 'saleTime',
      headerName: 'Sale Time',
      width: 130,
    },
    { field: 'saleLocation', headerName: 'Location', width: 150 },
    { field: 'ownerName', headerName: 'Owner', width: 200 },
    { field: 'minimumBid', headerName: 'Min. Bid', width: 100 },
    { field: 'county', headerName: 'County', width: 130 },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 150,
      renderCell: (params) => {
        const note = propertyNotes[params.row.propertyID]?.[userId];
        return (
          <Select
            value={note?.priority || ''}
            onChange={(e) => {
              setPropertyNote(params.row.propertyID, { priority: e.target.value || null });
            }}
            size="small"
            sx={{
              width: '100%',
              '& .MuiSelect-select': {
                color: note?.priority === 'high' ? '#ef4444' :
                       note?.priority === 'medium' ? '#eab308' :
                       note?.priority === 'low' ? '#9ca3af' : 'inherit'
              }
            }}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="high" sx={{ color: '#ef4444' }}>High</MenuItem>
            <MenuItem value="medium" sx={{ color: '#eab308' }}>Medium</MenuItem>
            <MenuItem value="low" sx={{ color: '#9ca3af' }}>Low</MenuItem>
          </Select>
        );
      },
    },
    {
      field: 'comment',
      headerName: 'Notes',
      width: 200,
      renderCell: (params) => {
        const note = propertyNotes[params.row.propertyID]?.[userId];
        return (
          <TextField
            size="small"
            value={note?.comment || ''}
            onChange={(e) => {
              setPropertyNote(params.row.propertyID, { comment: e.target.value });
            }}
            sx={{ width: '100%' }}
          />
        );
      },
    },
  ];

  const rows = Array.isArray(properties) ? properties.map((property, index) => ({
    id: index,
    ...property,
    priority: propertyNotes[property.propertyID]?.[userId]?.priority || null,
    comment: propertyNotes[property.propertyID]?.[userId]?.comment || '',
  })) : [];

  const handleColumnVisibilityChange = (model: GridColumnVisibilityModel) => {
    setColumnVisibility(model);
  };

  const handleShowAllColumns = () => {
    const allVisible = columns.reduce((acc, column) => {
      acc[column.field] = true;
      return acc;
    }, {} as GridColumnVisibilityModel);
    setColumnVisibility(allVisible);
  };

  const handleColumnMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleColumnMenuClose = () => {
    setAnchorEl(null);
  };

  const handleColumnToggle = (field: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px)', // Subtract AppBar height
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Box sx={{ p: 1, display: 'flex', gap: 1 }}>
        <Button
          size="small"
          startIcon={<Eye />}
          onClick={handleColumnMenuClick}
          variant="outlined"
        >
          Columns
        </Button>
        <Button
          size="small"
          onClick={handleShowAllColumns}
          variant="outlined"
        >
          Show All
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleColumnMenuClose}
          PaperProps={{
            sx: { maxHeight: 300 }
          }}
        >
          {columns.map((column) => (
            <MenuItem key={column.field} onClick={() => handleColumnToggle(column.field)}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={columnVisibility[column.field] !== false}
                    onChange={() => handleColumnToggle(column.field)}
                  />
                }
                label={column.headerName}
                sx={{ ml: 0 }}
              />
            </MenuItem>
          ))}
        </Menu>
      </Box>
      <Box sx={{ 
        flexGrow: 1,
        height: 'calc(100% - 48px)', // Subtract toolbar height
        '& .MuiDataGrid-root': {
          border: 'none',
        }
      }}>
        <DataGrid
          rows={rows}
          columns={columns}
          columnVisibilityModel={columnVisibility}
          onColumnVisibilityModelChange={handleColumnVisibilityChange}
          initialState={{
            sorting: {
              sortModel: [{ field: 'saleDate', sort: 'asc' }],
            },
          }}
          sx={{ 
            height: '100%',
            width: '100%',
            '& .MuiDataGrid-main': {
              overflow: 'auto'
            },
            '& .MuiDataGrid-virtualScroller': {
              overflow: 'auto'
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default PropertyTable;