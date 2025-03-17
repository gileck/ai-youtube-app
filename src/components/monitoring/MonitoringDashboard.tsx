'use client';

import React from 'react';
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
  TableRow
} from '@mui/material';
import { useApiClient } from '../../contexts/ApiContext';
import { useSettings } from '../../contexts/SettingsContext';

export default function MonitoringDashboard() {
  const { stats } = useApiClient();
  const { settings } = useSettings();
  
  // Calculate cache efficiency
  const cacheEfficiency = stats.totalCalls > 0 
    ? Math.round((stats.cacheHits / stats.totalCalls) * 100) 
    : 0;
  
  // Calculate estimated savings from cache
  const estimatedSavings = stats.cacheHits * 0.01; // Rough estimate of $0.01 saved per cache hit
  
  return (
    <Box>
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total API Calls
              </Typography>
              <Typography variant="h4">
                {stats.totalCalls}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Cost
              </Typography>
              <Typography variant="h4">
                ${stats.totalCost.toFixed(4)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Cache Efficiency
              </Typography>
              <Typography variant="h4">
                {cacheEfficiency}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Estimated Savings
              </Typography>
              <Typography variant="h4">
                ${estimatedSavings.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
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
                    Current Settings
                  </Typography>
                  <Typography variant="body2" paragraph>
                    AI Model: {settings.aiModel}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Cost Approval Threshold: ${settings.costApprovalThreshold.toFixed(2)}
                  </Typography>
                  <Typography variant="body2">
                    Caching: {settings.cachingEnabled ? 'Enabled' : 'Disabled'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Usage Tips */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Usage Tips
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
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
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
