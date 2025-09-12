import React from 'react';
import { Layout } from '@/components/Layout';
import { LabelGenerator as LabelGeneratorComponent } from '@/components/LabelGenerator';

const LabelGenerator: React.FC = () => {
  return (
    <Layout>
      <LabelGeneratorComponent />
    </Layout>
  );
};

export default LabelGenerator;