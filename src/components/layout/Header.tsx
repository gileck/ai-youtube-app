'use client';

import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  useTheme,
  useMediaQuery,
  Button
} from '@mui/material';
import YouTubeIcon from '@mui/icons-material/YouTube';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import SettingsIcon from '@mui/icons-material/Settings';
import MonitorIcon from '@mui/icons-material/Monitor';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppMenu from './AppMenu';

export default function Header() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();
  
  // Navigation items
  const navItems = [
    { label: 'Search', icon: <SearchIcon />, path: '/search' },
    { label: 'Bookmarks', icon: <BookmarkIcon />, path: '/bookmarks' },
    { label: 'History', icon: <HistoryIcon />, path: '/history' },
    { label: 'Monitoring', icon: <MonitorIcon />, path: '/monitoring' },
    { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];
  
  // Check if a path is active
  const isActive = (path: string) => {
    return pathname === path || (path !== '/' && pathname?.startsWith(path));
  };
  
  return (
    <AppBar 
      position="sticky" 
      color="primary" 
      elevation={0}
      sx={{ 
        background: 'linear-gradient(90deg, rgba(255,0,0,1) 0%, rgba(200,0,0,1) 100%)',
        borderBottom: 'none',
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Left side - Menu and Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AppMenu />
          
          <Box 
            component={Link}
            href="/"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none', 
              color: 'white',
              ml: 1
            }}
          >
            <YouTubeIcon sx={{ fontSize: 32, mr: 1 }} />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              YouTube AI
            </Typography>
          </Box>
        </Box>
        
        {/* Right side - Navigation */}
        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.label}
                component={Link}
                href={item.path}
                color="inherit"
                startIcon={item.icon}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  textTransform: 'none',
                  backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
