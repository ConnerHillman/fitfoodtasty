// Phase 3: Production-ready label system
export { BaseLabel } from './BaseLabel';
export { LabelSheet } from './LabelSheet';
export { LabelContentAnalyzer } from './LabelContentAnalyzer';
export { LabelContentOptimizer } from './LabelContentOptimizer';

// Re-export types for convenience
export type { LabelData, FullLabelData } from '@/types/label';
export { LABEL_DIMENSIONS, DEFAULT_INSTRUCTIONS } from '@/types/label';
export type { ContentAnalysis, ScalingFactors, SpacingConfig, QualityMode } from './LabelContentAnalyzer';