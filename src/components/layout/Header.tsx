'use client';

import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box, 
  TextField, 
  InputAdornment,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import { useSettings } from '../../contexts/SettingsContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };
  
  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };
  
  const handleModelChange = (model: string) => {
    updateSettings({ aiModel: model });
    handleSettingsClose();
  };
  
  const handleThresholdChange = (threshold: number) => {
    updateSettings({ costApprovalThreshold: threshold });
    handleSettingsClose();
  };
  
  const handleCachingToggle = () => {
    updateSettings({ cachingEnabled: !settings.cachingEnabled });
    handleSettingsClose();
  };
  
  return (
    <AppBar position="static" color="primary" elevation={0}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component={Link} 
          href="/"
          sx={{ 
            textDecoration: 'none', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            mr: 2
          }}
        >
          YouTube AI Summarizer
        </Typography>
        
        <Box component="form" onSubmit={handleSearch} sx={{ flexGrow: 1, mx: 2 }}>
          <TextField
            fullWidth
            placeholder="Enter YouTube URL or search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: { 
                bgcolor: 'white', 
                borderRadius: 1,
                '& fieldset': { border: 'none' }
              }
            }}
          />
        </Box>
        
        <Button 
          color="inherit" 
          startIcon={<HistoryIcon />}
          component={Link}
          href="/history"
        >
          History
        </Button>
        
        <IconButton 
          color="inherit" 
          onClick={handleSettingsClick}
          aria-label="settings"
        >
          <SettingsIcon />
        </IconButton>
        
        <Menu
          anchorEl={settingsAnchorEl}
          open={Boolean(settingsAnchorEl)}
          onClose={handleSettingsClose}
        >
          <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
            AI Model
          </Typography>
          <MenuItem 
            onClick={() => handleModelChange('gpt-3.5-turbo')}
            selected={settings.aiModel === 'gpt-3.5-turbo'}
          >
            GPT-3.5 Turbo
          </MenuItem>
          <MenuItem 
            onClick={() => handleModelChange('gpt-4')}
            selected={settings.aiModel === 'gpt-4'}
          >
            GPT-4
          </MenuItem>
          <MenuItem 
            onClick={() => handleModelChange('gemini-pro')}
            selected={settings.aiModel === 'gemini-pro'}
          >
            Gemini Pro
          </MenuItem>
          
          <Divider />
          
          <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
            Cost Approval Threshold
          </Typography>
          <MenuItem 
            onClick={() => handleThresholdChange(0.05)}
            selected={settings.costApprovalThreshold === 0.05}
          >
            $0.05
          </MenuItem>
          <MenuItem 
            onClick={() => handleThresholdChange(0.10)}
            selected={settings.costApprovalThreshold === 0.10}
          >
            $0.10
          </MenuItem>
          <MenuItem 
            onClick={() => handleThresholdChange(0.25)}
            selected={settings.costApprovalThreshold === 0.25}
          >
            $0.25
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleCachingToggle}>
            {settings.cachingEnabled ? 'Disable Caching' : 'Enable Caching'}
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
