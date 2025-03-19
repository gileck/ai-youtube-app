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
import InfoIcon from '@mui/icons-material/Info';
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

export default function MonitoringDashboard() {
  const { stats } = useApiClient();
  const { settings } = useSettings();
  const { calls, summary, isLoading, error, refreshData, clearData } = useMonitoring();
  
  const [tabValue, setTabValue] = useState(0);
  const [selectedCall, setSelectedCall] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  
  // Calculate cache efficiency
  const cacheEfficiency = stats.totalCalls > 0 
    ? Math.round((stats.cacheHits / stats.totalCalls) * 100) 
    : 0;
  
  // Calculate estimated savings from cache
  const estimatedSavings = stats.cacheHits * 0.01; // Rough estimate of $0.01 saved per cache hit
  
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
  
  // Find the selected call details
  const selectedCallDetails = selectedCall ? calls.find(call => call.id === selectedCall) : null;
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="monitoring tabs">
          <Tab label="Overview" />
          <Tab label="API Calls" />
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
                <Typography variant="h6" gutterBottom>
                  Cache Statistics
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Metric</TableCell>
                            <TableCell align="right">Value</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>Cache Hits</TableCell>
                            <TableCell align="right">{stats.cacheHits}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Cache Misses</TableCell>
                            <TableCell align="right">{stats.cacheMisses}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Hit Rate</TableCell>
                            <TableCell align="right">{cacheEfficiency}%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Caching Enabled</TableCell>
                            <TableCell align="right">{settings.cachingEnabled ? 'Yes' : 'No'}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Estimated Savings
                      </Typography>
                      <Typography variant="h4" color="success.main" gutterBottom>
                        ${estimatedSavings.toFixed(2)}
                      </Typography>
                      <Typography variant="body2">
                        Based on an estimated saving of $0.01 per cache hit
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {/* API Calls Tab */}
        {tabValue === 1 && (
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
        
        {/* Settings Tab */}
        {tabValue === 2 && (
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
    </Box>
  );
}
