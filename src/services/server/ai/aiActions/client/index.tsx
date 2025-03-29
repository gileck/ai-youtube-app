'use client';

import React from 'react';
import { AIActionParams, AIResponse } from '../../../../../types/shared/ai';

import SummaryRenderer, { SummaryActionMeta } from '../summary/client/SummaryAction';
import QuestionRenderer, { QuestionActionMeta } from '../question/client/QuestionAction';
import KeypointsRenderer, { KeypointsActionMeta } from '../keypoints/client/KeypointsAction';
import TopicsRenderer, { TopicsActionMeta } from '../topics/client/TopicsAction';
import KeyTakeawayRenderer, { KeyTakeawayActionMeta, KeyTakeawayRendererProps } from '../keytakeaway/client/KeyTakeawayAction';

/**
 * Define the props for all action renderers
 */
export interface ActionRendererProps {
  result: AIResponse;
  params?: AIActionParams;
  videoId?: string;
}

/**
 * Define the structure for action metadata
 */
export interface ActionMeta {
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

// Define the available AI actions with their renderers
export const AI_ACTIONS: Record<string, {
  label: string;
  icon: React.ReactNode;
  description: string;
  renderResult: (props: ActionRendererProps) => React.ReactNode;
}> = {
  [SummaryActionMeta.key]: {
    label: SummaryActionMeta.label,
    icon: SummaryActionMeta.icon,
    description: SummaryActionMeta.description,
    renderResult: (props) => <SummaryRenderer {...props} />
  },
  [QuestionActionMeta.key]: {
    label: QuestionActionMeta.label,
    icon: QuestionActionMeta.icon,
    description: QuestionActionMeta.description,
    renderResult: (props) => <QuestionRenderer {...props} />
  },
  [KeypointsActionMeta.key]: {
    label: KeypointsActionMeta.label,
    icon: KeypointsActionMeta.icon,
    description: KeypointsActionMeta.description,
    renderResult: (props) => <KeypointsRenderer {...props} />
  },
  [TopicsActionMeta.key]: {
    label: TopicsActionMeta.label,
    icon: TopicsActionMeta.icon,
    description: TopicsActionMeta.description,
    renderResult: (props) => <TopicsRenderer {...props} />
  },
  [KeyTakeawayActionMeta.key]: {
    label: KeyTakeawayActionMeta.label,
    icon: KeyTakeawayActionMeta.icon,
    description: KeyTakeawayActionMeta.description,
    renderResult: (props) => <KeyTakeawayRenderer {...props as unknown as KeyTakeawayRendererProps} />
  }
};

// Export individual renderers
export { SummaryRenderer, QuestionRenderer, KeypointsRenderer, TopicsRenderer, KeyTakeawayRenderer };

// Export metadata
export { SummaryActionMeta, QuestionActionMeta, KeypointsActionMeta, TopicsActionMeta, KeyTakeawayActionMeta };
