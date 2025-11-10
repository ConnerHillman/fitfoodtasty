import { useState, useMemo } from 'react';
import { useEnhancedDataManager } from './useEnhancedDataManager';
import type { DataManagerConfig } from '@/types/api';

interface EmailTemplate {
  id: string;
  template_name: string;
  template_type: string;
  subject_template: string;
  html_content: string;
  text_content?: string;
  is_active: boolean;
  is_default: boolean;
  variables: string[];
  created_at: string;
  updated_at: string;
}

interface EmailTemplatesFilters {
  searchTerm: string;
  templateType: string;
  showInactive: boolean;
}

export const useStandardizedEmailTemplatesData = () => {
  const [filters, setFilters] = useState<EmailTemplatesFilters>({
    searchTerm: '',
    templateType: 'all',
    showInactive: false
  });

  const config: DataManagerConfig = {
    orderBy: { column: 'created_at', ascending: false }
  };

  const {
    data: templates,
    loading,
    error,
    create,
    update,
    remove,
    refetch
  } = useEnhancedDataManager<EmailTemplate>('order_email_templates', config);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Filter by active status
    if (!filters.showInactive) {
      filtered = filtered.filter(t => t.is_active);
    }

    // Filter by template type
    if (filters.templateType !== 'all') {
      filtered = filtered.filter(t => t.template_type === filters.templateType);
    }

    // Filter by search term
    if (filters.searchTerm.trim()) {
      const query = filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(t =>
        t.template_name.toLowerCase().includes(query) ||
        t.subject_template.toLowerCase().includes(query) ||
        t.template_type.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [templates, filters]);

  // Stats
  const stats = useMemo(() => ({
    total: templates.length,
    active: templates.filter(t => t.is_active).length,
    inactive: templates.filter(t => !t.is_active).length,
    default: templates.filter(t => t.is_default).length,
    byType: templates.reduce((acc, t) => {
      acc[t.template_type] = (acc[t.template_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  }), [templates]);

  // Template types available
  const templateTypes = useMemo(() => {
    const types = new Set(templates.map(t => t.template_type));
    return Array.from(types).sort();
  }, [templates]);

  return {
    // Data
    templates: filteredTemplates,
    allTemplates: templates,
    loading,
    error,
    stats,
    templateTypes,

    // Filters
    filters,
    setFilters,

    // CRUD operations
    createTemplate: create,
    updateTemplate: update,
    deleteTemplate: remove,
    refetch
  };
};
