'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useApiClient } from '../../contexts/ApiContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useMonitoring } from '../../contexts/MonitoringContext';
import { formatDate } from '../../utils/formatters';

// Helper function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  }).format(value);
};

// Helper function to format large numbers
const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value);
};

// Helper function to format duration in ms to readable format
const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

// Helper function to format date from timestamp
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

// Define types for cache entries and YouTube metrics
interface CacheEntry {
  key: string;
  action: string;
  videoId: string;
  model: string;
  timestamp: number;
  expiresAt: number;
  hits: number;
}

interface YouTubeMetricExtended {
  id?: string;
  endpoint: string;
  timestamp: number;
  duration: number;
  status: number;
  cached: boolean;
  params: Record<string, string>;
  quotaCost?: number;
  error?: string;
}

export default function MonitoringDashboard() {
  const { } = useApiClient();
  const { settings } = useSettings();
  const { 
    calls, 
    summary, 
    isLoading, 
    error, 
    refreshData, 
    clearData, 
    cacheStats,
    youtubeMetrics,
    youtubeSummary,
    clearYoutubeMetrics
  } = useMonitoring();
  
  const [tabValue, setTabValue] = useState(0);
  const [selectedCall, setSelectedCall] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmClearCacheOpen, setConfirmClearCacheOpen] = useState(false);
  const [confirmClearYoutubeOpen, setConfirmClearYoutubeOpen] = useState(false);
  
  // Calculate cache efficiency from server stats
  const cacheEfficiency = cacheStats && cacheStats.totalHits > 0 && cacheStats.totalEntries > 0
    ? Math.round((cacheStats.totalHits / (cacheStats.totalHits + summary.totalCalls)) * 100)
    : 0;
  
  // Calculate estimated savings from cache
  const estimatedSavings = cacheStats && cacheStats.totalHits
    ? Math.round(cacheStats.totalHits * 0.01 * 10000) / 10000 // Rough estimate of $0.01 saved per cache hit
    : 0;
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleRefresh = () => {
    refreshData();
  };
  
  const handleClearConfirmOpen = () => {
    setConfirmClearOpen(true);
  };
  
  const handleClearConfirmClose = () => {
    setConfirmClearOpen(false);
  };
  
  const handleClearData = () => {
    clearData();
    setConfirmClearOpen(false);
  };
  
  const handleViewCallDetails = (callId: string) => {
    setSelectedCall(callId);
  };
  
  const handleCloseCallDetails = () => {
    setSelectedCall(null);
  };
  
  // Handle clearing cache
  const handleClearCacheConfirmOpen = () => {
    setConfirmClearCacheOpen(true);
  };
  
  const handleClearCacheConfirmClose = () => {
    setConfirmClearCacheOpen(false);
  };
  
  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear_cache' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        refreshData();
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setConfirmClearCacheOpen(false);
    }
  };
  
  // Handle clearing YouTube metrics
  const handleClearYoutubeConfirmOpen = () => {
    setConfirmClearYoutubeOpen(true);
  };
  
  const handleClearYoutubeConfirmClose = () => {
    setConfirmClearYoutubeOpen(false);
  };
  
  const handleClearYoutubeMetrics = async () => {
    try {
      await clearYoutubeMetrics();
    } catch (error) {
      console.error('Error clearing YouTube metrics:', error);
    } finally {
      setConfirmClearYoutubeOpen(false);
    }
  };
  
  // Find the selected call details
  const selectedCallDetails = selectedCall ? calls.find(call => call.id === selectedCall) : null;
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="monitoring tabs">
          <Tab label="Overview" />
          <Tab label="AI Models" />
          <Tab label="API Calls" />
          <Tab label="YouTube API" />
          <Tab label="Settings" />
        </Tabs>
        
        <Box>
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} disabled={isLoading}>
              {isLoading ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          
          {calls.length > 0 && (
            <Tooltip title="Clear all data">
              <IconButton color="error" onClick={handleClearConfirmOpen}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {/* Overview Tab */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {/* Summary Cards */}
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total API Calls
                  </Typography>
                  <Typography variant="h4">
                    {summary.totalCalls}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total AI Cost
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(summary.totalCost)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Tokens
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(summary.totalInputTokens + summary.totalOutputTokens)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Avg. Response Time
                  </Typography>
                  <Typography variant="h4">
                    {formatDuration(summary.averageResponseTime)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Cost by Model */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Cost by Model
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Model</TableCell>
                        <TableCell align="right">Cost</TableCell>
                        <TableCell align="right">% of Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(summary.costByModel).length > 0 ? (
                        Object.entries(summary.costByModel)
                          .sort(([, a], [, b]) => b - a)
                          .map(([model, cost]) => (
                            <TableRow key={model}>
                              <TableCell>{model}</TableCell>
                              <TableCell align="right">{formatCurrency(cost)}</TableCell>
                              <TableCell align="right">
                                {summary.totalCost > 0 ? `${((cost / summary.totalCost) * 100).toFixed(1)}%` : '0%'}
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} align="center">No data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
            
            {/* Cost by Action */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Cost by Action
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Action</TableCell>
                        <TableCell align="right">Cost</TableCell>
                        <TableCell align="right">% of Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(summary.costByAction).length > 0 ? (
                        Object.entries(summary.costByAction)
                          .sort(([, a], [, b]) => b - a)
                          .map(([action, cost]) => (
                            <TableRow key={action}>
                              <TableCell>{action}</TableCell>
                              <TableCell align="right">{formatCurrency(cost)}</TableCell>
                              <TableCell align="right">
                                {summary.totalCost > 0 ? `${((cost / summary.totalCost) * 100).toFixed(1)}%` : '0%'}
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} align="center">No data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
            
            {/* Cache Statistics */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Cache Statistics</Typography>
                  
                  <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<DeleteIcon />}
                    onClick={handleClearCacheConfirmOpen}
                    disabled={!cacheStats || cacheStats.totalEntries === 0}
                  >
                    Clear Cache
                  </Button>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                {cacheStats ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle1">Total Cached Entries</Typography>
                      <Typography variant="h5">{cacheStats.totalEntries}</Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle1">Total Cache Hits</Typography>
                      <Typography variant="h5">{cacheStats.totalHits}</Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle1">Cache Size</Typography>
                      <Typography variant="h5">{(cacheStats.totalSize / (1024 * 1024)).toFixed(2)} MB</Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle1">Estimated Savings</Typography>
                      <Typography variant="h5">{formatCurrency(estimatedSavings)}</Typography>
                    </Grid>
                    
                    {cacheStats.totalEntries > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Cached Entries by Action</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {Object.entries(cacheStats.entriesByAction).map(([action, count]) => (
                            <Chip 
                              key={action}
                              label={`${action}: ${count}`}
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Grid>
                    )}
                    
                    {cacheStats.entries && cacheStats.entries.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Recent Cache Entries</Typography>
                        <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell>Action</TableCell>
                                <TableCell>Video ID</TableCell>
                                <TableCell>Model</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell>Expires</TableCell>
                                <TableCell>Hits</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {cacheStats.entries.slice(0, 10).map((entry: CacheEntry) => (
                                <TableRow key={entry.key}>
                                  <TableCell>{entry.action}</TableCell>
                                  <TableCell>{entry.videoId}</TableCell>
                                  <TableCell>{entry.model}</TableCell>
                                  <TableCell>{formatDate(entry.timestamp)}</TableCell>
                                  <TableCell>{formatDate(entry.expiresAt)}</TableCell>
                                  <TableCell>{entry.hits}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                    )}
                  </Grid>
                ) : (
                  <Typography>No cache statistics available</Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {/* AI Models Tab */}
        {tabValue === 1 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              AI Models Usage & Pricing
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              {/* Current Model */}
              <Grid item xs={12} md={6}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Current Model
                    </Typography>
                    <Typography variant="h5">
                      {settings.aiModel}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Cache Status */}
              <Grid item xs={12} md={6}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Cache Status
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h5">
                        {settings.cachingEnabled ? 'Enabled' : 'Disabled'}
                      </Typography>
                      <Chip 
                        label={`${cacheEfficiency}% Efficiency`} 
                        color={cacheEfficiency > 50 ? "success" : cacheEfficiency > 20 ? "warning" : "error"} 
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Cost by Model */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Cost by Model
                </Typography>
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Provider</TableCell>
                        <TableCell>Model</TableCell>
                        <TableCell align="right">Calls</TableCell>
                        <TableCell align="right">Input Tokens</TableCell>
                        <TableCell align="right">Output Tokens</TableCell>
                        <TableCell align="right">Input Cost</TableCell>
                        <TableCell align="right">Output Cost</TableCell>
                        <TableCell align="right">Total Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(summary.costByModel).length > 0 ? (
                        Object.entries(summary.costByModel)
                          .sort(([, a], [, b]) => b - a)
                          .map(([modelKey, cost]) => {
                            // Split provider:model format
                            const [provider, model] = modelKey.split(':');
                            
                            // Calculate model-specific metrics
                            const modelCalls = calls.filter(call => 
                              (provider && call.provider === provider) && 
                              (model && call.model === model)
                            );
                            
                            const inputTokens = modelCalls.reduce((sum, call) => sum + call.inputTokens, 0);
                            const outputTokens = modelCalls.reduce((sum, call) => sum + call.outputTokens, 0);
                            const inputCost = modelCalls.reduce((sum, call) => sum + call.inputCost, 0);
                            const outputCost = modelCalls.reduce((sum, call) => sum + call.outputCost, 0);
                            
                            return (
                              <TableRow key={modelKey}>
                                <TableCell>{provider || 'Unknown'}</TableCell>
                                <TableCell>{model || modelKey}</TableCell>
                                <TableCell align="right">{modelCalls.length}</TableCell>
                                <TableCell align="right">{formatNumber(inputTokens)}</TableCell>
                                <TableCell align="right">{formatNumber(outputTokens)}</TableCell>
                                <TableCell align="right">{formatCurrency(inputCost)}</TableCell>
                                <TableCell align="right">{formatCurrency(outputCost)}</TableCell>
                                <TableCell align="right">{formatCurrency(cost)}</TableCell>
                              </TableRow>
                            );
                          })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} align="center">No data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Cost by Action */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Cost by Action
                </Typography>
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Action</TableCell>
                        <TableCell align="right">Calls</TableCell>
                        <TableCell align="right">Tokens</TableCell>
                        <TableCell align="right">Avg. Response Time</TableCell>
                        <TableCell align="right">Cost</TableCell>
                        <TableCell align="right">% of Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(summary.costByAction).length > 0 ? (
                        Object.entries(summary.costByAction)
                          .sort(([, a], [, b]) => b - a)
                          .map(([action, cost]) => {
                            // Calculate action-specific metrics
                            const actionCalls = calls.filter(call => call.action === action);
                            const totalTokens = actionCalls.reduce((sum, call) => 
                              sum + call.inputTokens + call.outputTokens, 0
                            );
                            const avgResponseTime = actionCalls.length > 0 
                              ? actionCalls.reduce((sum, call) => sum + call.duration, 0) / actionCalls.length 
                              : 0;
                            
                            return (
                              <TableRow key={action}>
                                <TableCell>{action}</TableCell>
                                <TableCell align="right">{actionCalls.length}</TableCell>
                                <TableCell align="right">{formatNumber(totalTokens)}</TableCell>
                                <TableCell align="right">{formatDuration(avgResponseTime)}</TableCell>
                                <TableCell align="right">{formatCurrency(cost)}</TableCell>
                                <TableCell align="right">
                                  {summary.totalCost > 0 ? `${((cost / summary.totalCost) * 100).toFixed(1)}%` : '0%'}
                                </TableCell>
                              </TableRow>
                            );
                          })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center">No data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Cache Statistics */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Cache Statistics
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Estimated savings from cache: {formatCurrency(estimatedSavings)}
                    </Typography>
                  </Box>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<DeleteIcon />}
                    onClick={handleClearCacheConfirmOpen}
                    disabled={!cacheStats || cacheStats.totalEntries === 0}
                    size="small"
                  >
                    Clear Cache
                  </Button>
                </Box>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell align="right">Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cacheStats ? (
                        <>
                          <TableRow>
                            <TableCell>Total Cached Entries</TableCell>
                            <TableCell align="right">{cacheStats.totalEntries}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Total Cache Hits</TableCell>
                            <TableCell align="right">{cacheStats.totalHits}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Cache Size</TableCell>
                            <TableCell align="right">{(cacheStats.totalSize / (1024 * 1024)).toFixed(2)} MB</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Cache Efficiency</TableCell>
                            <TableCell align="right">{cacheEfficiency}%</TableCell>
                          </TableRow>
                        </>
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} align="center">No cache statistics available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Paper>
        )}
        
        {/* API Calls Tab */}
        {tabValue === 2 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent API Calls
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {calls.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Video</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Model</TableCell>
                      <TableCell align="right">Tokens</TableCell>
                      <TableCell align="right">Cost</TableCell>
                      <TableCell align="right">Duration</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {calls.map((call) => (
                      <TableRow key={call.id}>
                        <TableCell>{formatDate(call.timestamp)}</TableCell>
                        <TableCell>
                          <Tooltip title={call.videoTitle || call.videoId}>
                            <Typography noWrap sx={{ maxWidth: 150 }}>
                              {call.videoTitle || call.videoId}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{call.action}</TableCell>
                        <TableCell>{call.model}</TableCell>
                        <TableCell align="right">{formatNumber(call.inputTokens + call.outputTokens)}</TableCell>
                        <TableCell align="right">{formatCurrency(call.totalCost)}</TableCell>
                        <TableCell align="right">{formatDuration(call.duration)}</TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={call.success ? "Success" : "Failed"} 
                            color={call.success ? "success" : "error"} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewCallDetails(call.id)}
                            aria-label="view details"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No API calls recorded yet
                </Typography>
              </Box>
            )}
          </Paper>
        )}
        
        {/* YouTube API Tab */}
        {tabValue === 3 && (
          <Grid container spacing={3}>
            {/* YouTube API Summary */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">YouTube API Usage</Typography>
                  
                  <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<DeleteIcon />}
                    onClick={handleClearYoutubeConfirmOpen}
                    disabled={!youtubeSummary || youtubeSummary.totalCalls === 0}
                  >
                    Clear YouTube Metrics
                  </Button>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                {youtubeSummary ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle1">Total API Calls</Typography>
                      <Typography variant="h5">{youtubeSummary.totalCalls}</Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle1">Total Quota Used</Typography>
                      <Typography variant="h5">{youtubeSummary.totalQuotaCost}</Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle1">Cache Hits</Typography>
                      <Typography variant="h5">{youtubeSummary.cacheHits}</Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle1">Cache Efficiency</Typography>
                      <Typography variant="h5">
                        {youtubeSummary.totalCalls > 0 
                          ? Math.round((youtubeSummary.cacheHits / youtubeSummary.totalCalls) * 100) 
                          : 0}%
                      </Typography>
                    </Grid>
                    
                    {/* Quota by Endpoint */}
                    {Object.keys(youtubeSummary.quotaByEndpoint).length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Quota Usage by Endpoint</Typography>
                        <TableContainer component={Paper}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Endpoint</TableCell>
                                <TableCell align="right">Quota Used</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {Object.entries(youtubeSummary.quotaByEndpoint).map(([endpoint, quota]) => (
                                <TableRow key={endpoint}>
                                  <TableCell>{endpoint}</TableCell>
                                  <TableCell align="right">{Number(quota)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                    )}
                    
                    {/* Daily Quota Usage */}
                    {Object.keys(youtubeSummary.dailyQuotaUsage).length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Daily Quota Usage</Typography>
                        <TableContainer component={Paper}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell align="right">Quota Used</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {Object.entries(youtubeSummary.dailyQuotaUsage)
                                .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                                .map(([date, quota]) => (
                                  <TableRow key={date}>
                                    <TableCell>{formatDate(date)}</TableCell>
                                    <TableCell align="right">{Number(quota)}</TableCell>
                                  </TableRow>
                                ))
                              }
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                    )}
                    
                    {/* Recent YouTube API Calls */}
                    {youtubeMetrics.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Recent YouTube API Calls</Typography>
                        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell>Timestamp</TableCell>
                                <TableCell>Endpoint</TableCell>
                                <TableCell>Params</TableCell>
                                <TableCell>Quota Cost</TableCell>
                                <TableCell>Cached</TableCell>
                                <TableCell>Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {youtubeMetrics.slice(0, 20).map((call: YouTubeMetricExtended, index) => (
                                <TableRow key={call.id || index}>
                                  <TableCell>{formatDate(call.timestamp)}</TableCell>
                                  <TableCell>{call.endpoint}</TableCell>
                                  <TableCell>
                                    {Object.entries(call.params).map(([key, value]) => (
                                      <div key={key}><small>{key}: {String(value)}</small></div>
                                    ))}
                                  </TableCell>
                                  <TableCell>{call.quotaCost}</TableCell>
                                  <TableCell>
                                    {call.cached ? (
                                      <Chip size="small" color="success" label="Cached" />
                                    ) : (
                                      <Chip size="small" color="default" label="No" />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {call.status === 200 ? (
                                      <Chip size="small" color="success" label="Success" />
                                    ) : (
                                      <Tooltip title={call.error || 'Unknown error'}>
                                        <Chip size="small" color="error" label="Failed" />
                                      </Tooltip>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                    )}
                  </Grid>
                ) : (
                  <Typography>No YouTube API metrics available</Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {/* Settings Tab */}
        {tabValue === 4 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Current Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    AI Model
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {settings.aiModel}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    Cost Approval Threshold
                  </Typography>
                  <Typography variant="body1" paragraph>
                    ${settings.costApprovalThreshold.toFixed(2)}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    Caching
                  </Typography>
                  <Typography variant="body1">
                    {settings.cachingEnabled ? 'Enabled' : 'Disabled'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Usage Tips
                  </Typography>
                  <Typography variant="body2" paragraph>
                    • Enable caching to reduce costs and improve performance.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    • GPT-3.5 Turbo is more cost-effective for most summaries.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    • Use GPT-4 for complex questions or detailed analysis.
                  </Typography>
                  <Typography variant="body2">
                    • Adjust your cost approval threshold based on your usage patterns.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>
      
      {/* Call Details Dialog */}
      <Dialog
        open={Boolean(selectedCall)}
        onClose={handleCloseCallDetails}
        maxWidth="md"
        fullWidth
      >
        {selectedCallDetails && (
          <>
            <DialogTitle>
              API Call Details
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Video</Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedCallDetails.videoTitle || selectedCallDetails.videoId}
                  </Typography>
                  
                  <Typography variant="subtitle2">Action</Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedCallDetails.action}
                  </Typography>
                  
                  <Typography variant="subtitle2">Model</Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedCallDetails.model}
                  </Typography>
                  
                  <Typography variant="subtitle2">Provider</Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedCallDetails.provider}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Timestamp</Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(selectedCallDetails.timestamp)}
                  </Typography>
                  
                  <Typography variant="subtitle2">Duration</Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDuration(selectedCallDetails.duration)}
                  </Typography>
                  
                  <Typography variant="subtitle2">Status</Typography>
                  <Typography variant="body1" gutterBottom>
                    <Chip 
                      label={selectedCallDetails.success ? "Success" : "Failed"} 
                      color={selectedCallDetails.success ? "success" : "error"} 
                      size="small" 
                    />
                    {selectedCallDetails.error && (
                      <Typography color="error.main" variant="body2" sx={{ mt: 1 }}>
                        Error: {selectedCallDetails.error}
                      </Typography>
                    )}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Cost Breakdown
                  </Typography>
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Tokens</TableCell>
                          <TableCell align="right">Cost</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Input</TableCell>
                          <TableCell align="right">{formatNumber(selectedCallDetails.inputTokens)}</TableCell>
                          <TableCell align="right">{formatCurrency(selectedCallDetails.inputCost)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Output</TableCell>
                          <TableCell align="right">{formatNumber(selectedCallDetails.outputTokens)}</TableCell>
                          <TableCell align="right">{formatCurrency(selectedCallDetails.outputCost)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Total</strong></TableCell>
                          <TableCell align="right"><strong>{formatNumber(selectedCallDetails.inputTokens + selectedCallDetails.outputTokens)}</strong></TableCell>
                          <TableCell align="right"><strong>{formatCurrency(selectedCallDetails.totalCost)}</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseCallDetails}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Confirmation Dialog for Clearing Data */}
      <Dialog
        open={confirmClearOpen}
        onClose={handleClearConfirmClose}
      >
        <DialogTitle>Clear All Monitoring Data?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to clear all monitoring data? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearConfirmClose}>Cancel</Button>
          <Button onClick={handleClearData} color="error" variant="contained">
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Clear Cache Confirmation Dialog */}
      <Dialog
        open={confirmClearCacheOpen}
        onClose={handleClearCacheConfirmClose}
      >
        <DialogTitle>Clear Cache</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to clear all cached API responses? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearCacheConfirmClose}>Cancel</Button>
          <Button onClick={handleClearCache} color="error" variant="contained">
            Clear Cache
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Clear YouTube Metrics Confirmation Dialog */}
      <Dialog
        open={confirmClearYoutubeOpen}
        onClose={handleClearYoutubeConfirmClose}
      >
        <DialogTitle>Clear YouTube Metrics</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to clear all YouTube API metrics? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearYoutubeConfirmClose}>Cancel</Button>
          <Button onClick={handleClearYoutubeMetrics} color="error" variant="contained">
            Clear YouTube Metrics
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
