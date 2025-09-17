import React from 'react';
import AppLayout from '@/components/AppLayout';
import { LabelGenerator as LabelGeneratorComponent } from '@/components/LabelGenerator';

const LabelGenerator: React.FC = () => {
  return (
    <AppLayout>
      <LabelGeneratorComponent />
    </AppLayout>
  );
};

export default LabelGenerator;