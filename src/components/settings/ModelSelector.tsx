import React from 'react';
import { getModelsGroupedByProvider, formatCost } from '../../services/client/modelUtils';
import { 
  Box, 
  Typography, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface ModelSelectorProps {
  selectedModel: string;
  onChange: (modelId: string) => void;
}

/**
 * Model selector component for the settings panel
 * Uses the shared model definitions to ensure consistency between client and server
 */
export const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  selectedModel, 
  onChange 
}) => {
  // Get models grouped by provider using the client-side utility
  const modelsByProvider = getModelsGroupedByProvider();
  
  return (
    <Box>
      {Object.entries(modelsByProvider).map(([provider, models]) => (
        <Accordion key={provider} defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`panel-${provider}-content`}
            id={`panel-${provider}-header`}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}>
                {provider}
              </Typography>
              <Chip 
                label={`${models.length} models`} 
                size="small" 
                variant="outlined" 
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <RadioGroup
              aria-labelledby={`${provider}-models-group-label`}
              name="model-radio-buttons-group"
              value={selectedModel}
              onChange={(e) => onChange(e.target.value)}
            >
              {models.map(model => (
                <Paper 
                  key={model.id} 
                  variant="outlined" 
                  sx={{ 
                    mb: 1.5, 
                    p: { xs: 1, sm: 1.5 }, 
                    borderColor: selectedModel === model.id ? 'primary.main' : 'divider',
                    borderWidth: selectedModel === model.id ? 2 : 1,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: 'primary.light',
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <FormControlLabel
                    value={model.id}
                    control={<Radio />}
                    label={
                      <Box sx={{ ml: { xs: 0, sm: 1 } }}>
                        <Typography variant="subtitle1" component="div">
                          {model.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatCost(model.inputCostPer1KTokens)}/1K input tokens, 
                          {formatCost(model.outputCostPer1KTokens)}/1K output tokens
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {model.capabilities.slice(0, 3).map(capability => (
                            <Chip 
                              key={capability} 
                              label={capability.replace(/-/g, ' ')} 
                              size="small" 
                              variant="outlined" 
                            />
                          ))}
                          {model.capabilities.length > 3 && (
                            <Chip 
                              label={`+${model.capabilities.length - 3} more`} 
                              size="small" 
                              variant="outlined" 
                            />
                          )}
                        </Box>
                      </Box>
                    }
                    sx={{ 
                      alignItems: 'flex-start', 
                      margin: 0,
                      width: '100%'
                    }}
                  />
                </Paper>
              ))}
            </RadioGroup>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default ModelSelector;
