import { useCallback } from 'react';
import { useToast } from './use-toast';
import type { ApiError, ApiErrorCode } from '@/types/api';
import { ErrorMessages } from '@/types/api';

export const useErrorHandler = () => {
  const { toast } = useToast();

  const createApiError = useCallback((
    code: ApiErrorCode,
    message?: string,
    details?: any
  ): ApiError => ({
    code,
    message: message || ErrorMessages[code],
    details,
    timestamp: new Date().toISOString()
  }), []);

  const handleError = useCallback((error: any, context?: string): ApiError => {
    let apiError: ApiError;

    // Handle Supabase errors
    if (error?.code === 'PGRST301') {
      apiError = createApiError('RLS_VIOLATION' as ApiErrorCode, 'Access denied. You can only access your own data.');
    } else if (error?.code === '42501') {
      apiError = createApiError('AUTHORIZATION_ERROR' as ApiErrorCode);
    } else if (error?.code === '23505') {
      apiError = createApiError('VALIDATION_ERROR' as ApiErrorCode, 'Duplicate entry found.');
    } else if (error?.message?.includes('JWT')) {
      apiError = createApiError('AUTHENTICATION_ERROR' as ApiErrorCode);
    } else if (error?.message?.includes('network')) {
      apiError = createApiError('NETWORK_ERROR' as ApiErrorCode);
    } else if (error?.message?.includes('timeout')) {
      apiError = createApiError('TIMEOUT_ERROR' as ApiErrorCode);
    } else {
      apiError = createApiError(
        'UNKNOWN_ERROR' as ApiErrorCode,
        error?.message || 'An unexpected error occurred',
        error
      );
    }

    // Log error for debugging
    console.error(`[${context || 'API'}] Error:`, {
      code: apiError.code,
      message: apiError.message,
      originalError: error,
      timestamp: apiError.timestamp
    });

    return apiError;
  }, [createApiError]);

  const showError = useCallback((error: ApiError, customTitle?: string) => {
    toast({
      title: customTitle || 'Error',
      description: error.message,
      variant: 'destructive',
    });
  }, [toast]);

  const handleAndShowError = useCallback((error: any, context?: string, customTitle?: string): ApiError => {
    const apiError = handleError(error, context);
    showError(apiError, customTitle);
    return apiError;
  }, [handleError, showError]);

  return {
    createApiError,
    handleError,
    showError,
    handleAndShowError
  };
};