import React from 'react';
import { LabelSheet } from './labels/LabelSheet';
import type { LabelData } from '@/types/label';

interface LabelPreviewProps {
  data: LabelData;
  showSingle?: boolean;
}

export const LabelPreview: React.FC<LabelPreviewProps> = ({ data, showSingle = false }) => {
  return <LabelSheet data={data} showSingle={showSingle} />;
};