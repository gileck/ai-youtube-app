'use client';

import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider, 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Slider, 
  Switch,
  Grid,
  Alert
} from '@mui/material';
import { useSettings } from '../../contexts/SettingsContext';

export default function SettingsPanel() {
  const { settings, updateSettings } = useSettings();
  
  // Handle AI model change
  const handleModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ aiModel: event.target.value });
  };
  
  // Handle cost threshold change
  const handleThresholdChange = (_event: Event, newValue: number | number[]) => {
    updateSettings({ costApprovalThreshold: newValue as number });
  };
  
  // Handle caching toggle
  const handleCachingToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ cachingEnabled: event.target.checked });
  };
  
  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              AI Model
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <FormControl component="fieldset">
              <FormLabel component="legend">Select AI Model</FormLabel>
              <RadioGroup
                value={settings.aiModel}
                onChange={handleModelChange}
              >
                <FormControlLabel 
                  value="gpt-3.5-turbo" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body1">GPT-3.5 Turbo</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Faster, more cost-effective for most summaries
                      </Typography>
                    </Box>
                  } 
                />
                <FormControlLabel 
                  value="gpt-4" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body1">GPT-4</Typography>
                      <Typography variant="caption" color="text.secondary">
                        More accurate for complex questions and detailed analysis
                      </Typography>
                    </Box>
                  } 
                />
                <FormControlLabel 
                  value="gemini-pro" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body1">Gemini Pro</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Google&apos;s advanced AI model with strong reasoning capabilities
                      </Typography>
                    </Box>
                  } 
                />
              </RadioGroup>
            </FormControl>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cost Controls
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 4 }}>
              <Typography id="cost-threshold-slider" gutterBottom>
                Cost Approval Threshold: ${settings.costApprovalThreshold.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary" paragraph>
                You&apos;ll be asked for approval before processing requests that exceed this cost
              </Typography>
              <Slider
                value={settings.costApprovalThreshold}
                onChange={handleThresholdChange}
                aria-labelledby="cost-threshold-slider"
                step={0.05}
                marks={[
                  { value: 0.05, label: '$0.05' },
                  { value: 0.25, label: '$0.25' },
                  { value: 0.50, label: '$0.50' },
                ]}
                min={0.05}
                max={0.50}
              />
            </Box>
            
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.cachingEnabled}
                    onChange={handleCachingToggle}
                  />
                }
                label="Enable Caching"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Caching saves costs by reusing previous results when possible
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Alert severity="info">
            Your settings are automatically saved and will be applied to all future AI operations.
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
}
