'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  Slider, 
  Switch,
  Grid,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Stack,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import SpeedIcon from '@mui/icons-material/Speed';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import MemoryIcon from '@mui/icons-material/Memory';
import CachedIcon from '@mui/icons-material/Cached';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import { useSettings } from '../../contexts/SettingsContext';
import ModelSelector from './ModelSelector';
import { getAvailableModels, formatCost } from '../../services/client/modelUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

export default function SettingsPanel() {
  const { settings, updateSettings } = useSettings();
  const [tabValue, setTabValue] = React.useState(0);
  const models = getAvailableModels();
  const selectedModel = models.find(model => model.id === settings.aiModel);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle AI model change
  const handleModelChange = (modelId: string) => {
    updateSettings({ aiModel: modelId });
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
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="settings tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<MemoryIcon />} label="AI Models" {...a11yProps(0)} />
          <Tab icon={<SettingsSuggestIcon />} label="Preferences" {...a11yProps(1)} />
          <Tab icon={<CachedIcon />} label="Caching" {...a11yProps(2)} />
        </Tabs>
      </Box>
      
      {/* AI Models Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card variant="outlined">
              <CardHeader 
                title="Available AI Models" 
                subheader="Select the AI model to use for processing YouTube videos"
              />
              <Divider />
              <CardContent>
                <ModelSelector 
                  selectedModel={settings.aiModel} 
                  onChange={handleModelChange} 
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} lg={4}>
            <Card variant="outlined" sx={{ height: { xs: 'auto', lg: '100%' }}}>
              <CardHeader 
                title="Selected Model" 
                subheader="Current model information"
              />
              <Divider />
              <CardContent>
                {selectedModel ? (
                  <Stack spacing={2}>
                    <Typography variant="h6">{selectedModel.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={selectedModel.provider} 
                        size="small" 
                        color={selectedModel.provider === 'google' ? 'primary' : 'secondary'} 
                      />
                      <Chip 
                        icon={<SpeedIcon />} 
                        label={`${(selectedModel.maxTokens / 1000).toLocaleString()}K tokens`} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2">Pricing</Typography>
                      <Typography variant="body2">
                        Input: {formatCost(selectedModel.inputCostPer1KTokens)} per 1K tokens
                      </Typography>
                      <Typography variant="body2">
                        Output: {formatCost(selectedModel.outputCostPer1KTokens)} per 1K tokens
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2">Capabilities</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {selectedModel.capabilities.map(capability => (
                          <Chip 
                            key={capability} 
                            label={capability.replace(/-/g, ' ')} 
                            size="small" 
                            variant="outlined" 
                          />
                        ))}
                      </Box>
                    </Box>
                  </Stack>
                ) : (
                  <Typography>No model selected</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Preferences Tab */}
      <TabPanel value={tabValue} index={1}>
        <Card variant="outlined">
          <CardHeader 
            title="Cost Settings" 
            subheader="Configure when to request approval for AI processing"
            action={
              <Tooltip title="When the estimated cost exceeds this threshold, you'll be asked for approval before processing">
                <IconButton>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            }
          />
          <Divider />
          <CardContent>
            <Box sx={{ mb: 4 }}>
              <Typography id="cost-threshold-slider" gutterBottom>
                Cost Approval Threshold: ${settings.costApprovalThreshold.toFixed(2)}
              </Typography>
              <Slider
                aria-labelledby="cost-threshold-slider"
                value={settings.costApprovalThreshold}
                onChange={handleThresholdChange}
                step={0.01}
                marks={[
                  { value: 0, label: '$0' },
                  { value: 0.1, label: '$0.10' },
                  { value: 0.25, label: '$0.25' },
                  { value: 0.5, label: '$0.50' },
                  { value: 1, label: '$1.00' },
                ]}
                min={0}
                max={1}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `$${value.toFixed(2)}`}
              />
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  When the estimated cost of an AI operation exceeds ${settings.costApprovalThreshold.toFixed(2)}, 
                  you&apos;ll be asked for approval before processing.
                </Typography>
              </Alert>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Caching Tab */}
      <TabPanel value={tabValue} index={2}>
        <Card variant="outlined">
          <CardHeader 
            title="Caching Settings" 
            subheader="Configure response caching to save costs"
            action={
              <Tooltip title="Caching saves previous AI responses to avoid unnecessary API calls">
                <IconButton>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            }
          />
          <Divider />
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h6">Enable Caching</Typography>
                <Typography variant="body2" color="text.secondary">
                  Save previous AI responses to reduce costs and improve performance
                </Typography>
              </Box>
              <Switch
                checked={settings.cachingEnabled}
                onChange={handleCachingToggle}
                inputProps={{ 'aria-label': 'toggle caching' }}
              />
            </Box>
            
            {settings.cachingEnabled ? (
              <Alert severity="success" icon={<MoneyOffIcon />} sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Caching is enabled. Identical requests will use cached responses when available,
                  saving costs and improving response times.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Caching is disabled. Every request will generate a new AI response,
                  which may increase costs for repeated operations.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
}
