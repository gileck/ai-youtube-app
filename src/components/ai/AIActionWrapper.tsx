'use client';

import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  Tooltip, 
  Paper, 
  Collapse, 
  IconButton,
  Grid,
  Divider
} from '@mui/material';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CachedIcon from '@mui/icons-material/Cached';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';

interface AIActionWrapperProps {
  children: React.ReactNode;
  cost?: number;
  model?: string;
  actionType?: string;
  isCached?: boolean;
  tokens?: number;
  processingTime?: number;
}

/**
 * A wrapper component for AI actions that displays cost information
 * This allows adding price information to all AI actions without modifying each action individually
 */
const AIActionWrapper: React.FC<AIActionWrapperProps> = ({ 
  children, 
  cost, 
  model,
  actionType,
  isCached = false,
  tokens = 0,
  processingTime = 0
}) => {
  const [expanded, setExpanded] = useState(false);
  
  // Add debugging to help understand what cost data is being received
  useEffect(() => {
    console.log('AIActionWrapper received cost:', cost);
    console.log('AIActionWrapper received model:', model);
    console.log('AIActionWrapper received actionType:', actionType);
  }, [cost, model, actionType]);

  // Format the cost to display in a user-friendly way
  const formatCost = (cost?: number): string => {
    if (cost === undefined || cost === null) return 'N/A';
    
    // If cost is zero, just show $0
    if (cost === 0) {
      return '$0';
    }
    
    // Format as dollars with 2 decimal places for small costs, removing trailing zeros
    if (cost < 0.01) {
      // Convert to string with 4 decimal places
      const costStr = cost.toFixed(4);
      // Remove trailing zeros
      return `$${parseFloat(costStr)}`;
    }
    
    // Format as dollars with 2 decimal places for larger costs, removing trailing zeros
    const costStr = cost.toFixed(2);
    return `$${parseFloat(costStr)}`;
  };
  
  // Format processing time in milliseconds to a readable format
  const formatProcessingTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  // Toggle expanded state
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };
  
  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* AI Action Info Header */}
      <Paper 
        variant="outlined" 
        sx={{ 
          mb: 2, 
          p: 1.5,
          borderRadius: '4px 4px 0 0',
          borderBottom: expanded ? 'none' : undefined
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={isCached ? "Results from cache" : "Freshly generated results"}>
              <Chip
                icon={<CachedIcon fontSize="small" />}
                label={isCached ? "Cached" : "Fresh"}
                size="small"
                variant="outlined"
                color={isCached ? "success" : "default"}
                sx={{ mr: 1, fontSize: '0.75rem', height: 24 }}
              />
            </Tooltip>
            
            <Tooltip title={`Cost: ${formatCost(cost)}`}>
              <Chip
                icon={<MonetizationOnOutlinedIcon fontSize="small" />}
                label={`Cost: ${formatCost(cost)}`}
                size="small"
                variant="outlined"
                color={(cost !== undefined && cost !== null && cost > 0) ? "primary" : "default"}
                sx={{ mr: 1, fontSize: '0.75rem', height: 24 }}
              />
            </Tooltip>
            
            {model && (
              <Tooltip title={`Model: ${model}`}>
                <Chip
                  icon={<ModelTrainingIcon fontSize="small" />}
                  label={model}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 1, fontSize: '0.75rem', height: 24 }}
                />
              </Tooltip>
            )}
          </Box>
          
          <IconButton 
            size="small" 
            onClick={handleToggleExpand}
            aria-expanded={expanded}
            aria-label="show more details"
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        {/* Expanded details */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Action Type
                </Typography>
                <Typography variant="body2">{actionType || 'Unknown'}</Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Model
                </Typography>
                <Typography variant="body2">{model || 'Unknown'}</Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Tokens
                </Typography>
                <Typography variant="body2">{tokens > 0 ? tokens.toLocaleString() : 'N/A'}</Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Processing Time
                </Typography>
                <Typography variant="body2">
                  {processingTime > 0 ? formatProcessingTime(processingTime) : 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Paper>
      
      {/* Main content */}
      <Box sx={{ mb: 2 }}>
        {children}
      </Box>
    </Box>
  );
};

export default AIActionWrapper;
