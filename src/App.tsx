import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import Dashboard from './components/Dashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4b5563', // gray-600
    },
    secondary: {
      main: '#dc2626', // red-600
    },
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#4b5563',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider 
        maxSnack={3}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <div className="min-h-screen bg-gray-50">
          <Dashboard />
        </div>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;