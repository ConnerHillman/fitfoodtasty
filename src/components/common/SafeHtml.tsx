import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

interface SafeHtmlProps {
  html: string;
  className?: string;
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
}

/**
 * SafeHtml Component
 * 
 * Safely renders HTML content by sanitizing it with DOMPurify.
 * Use this instead of dangerouslySetInnerHTML to prevent XSS attacks.
 * 
 * @param html - The HTML string to render
 * @param className - Optional CSS classes
 * @param allowedTags - Optional array of allowed HTML tags (defaults to safe subset)
 * @param allowedAttributes - Optional object mapping tags to allowed attributes
 */
export const SafeHtml = ({ 
  html, 
  className,
  allowedTags,
  allowedAttributes
}: SafeHtmlProps) => {
  const sanitizedHtml = useMemo(() => {
    // Use type assertion to handle DOMPurify config typing
    const config: any = {
      ALLOWED_TAGS: allowedTags || [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'span', 'div', 'blockquote', 'pre', 'code',
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img'
      ],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false
    };

    // Add attribute restrictions if provided
    if (allowedAttributes) {
      config.ALLOWED_ATTR = allowedAttributes;
    }

    return DOMPurify.sanitize(html, config);
  }, [html, allowedTags, allowedAttributes]);

  return (
    <div 
      className={cn("prose prose-sm max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      aria-label="Sanitized HTML content"
    />
  );
};

export default SafeHtml;
