import React from 'react';
import { ExternalLink } from 'lucide-react';
import { parseLinks } from '../utils/linkify';

interface LinkifiedTextProps {
  text: string;
  className?: string;
  linkClassName?: string;
  showIcon?: boolean;
}

export const LinkifiedText: React.FC<LinkifiedTextProps> = ({
  text,
  className = '',
  linkClassName = '',
  showIcon = true,
}) => {
  const parts = parseLinks(text);

  if (parts.length === 0) return null;

  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (part.type === 'link' && part.url) {
          return (
            <a
              key={idx}
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`inline text-blue-600 hover:text-blue-800 underline underline-offset-2 break-all font-semibold transition-colors ${linkClassName}`}
            >
              <span>{part.content}</span>
              {showIcon && (
                <ExternalLink className="w-3 h-3 inline-block ml-0.5 -mt-0.5 opacity-70 align-middle" />
              )}
            </a>
          );
        }
        return <React.Fragment key={idx}>{part.content}</React.Fragment>;
      })}
    </span>
  );
};

