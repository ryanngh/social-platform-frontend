import React from 'react';
import { Link } from 'react-router-dom';
import { getProfileUrl } from '../../utils/user';
import { normalizeUrl } from '../../utils/linkPreview';

interface FormattedTextProps {
  text?: string | null;
  className?: string;
  mentionClassName?: string;
  hashtagClassName?: string;
  urlClassName?: string;
}

/**
 * FormattedText component that detects and renders clickable:
 * 1. URLs (https://..., http://..., www...., *.app, *.com, etc.)
 * 2. @mentions with routing to user profiles
 * 3. #hashtags with routing to search tags
 */
export const FormattedText: React.FC<FormattedTextProps> = ({
  text,
  className = '',
  mentionClassName = 'text-[#004AC6] dark:text-[#0095F6] font-semibold hover:underline cursor-pointer inline-flex items-center',
  hashtagClassName = 'text-[#004AC6] dark:text-[#0095F6] font-semibold hover:underline cursor-pointer inline-flex items-center',
  urlClassName = 'text-[#004AC6] dark:text-[#0095F6] hover:underline cursor-pointer inline-flex items-center break-all font-medium',
}) => {
  if (!text) return null;

  // Unified Regex for URLs, @mentions, and #hashtags
  const tokenRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+|www\.[^\s<>"{}|\\^`[\]]+|(?:[a-zA-Z0-9-]+\.)+(?:com|app|io|org|net|dev|vn|edu|gov)(?:\/[^\s<>"{}|\\^`[\]]*)?)|(?:^|(?<=[\s([{"']))(?:@([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)|#([\w\p{L}_-]+))/giu;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    const matchStart = match.index;
    const fullMatch = match[0];
    const urlMatch = match[1];
    const mentionMatch = match[2];
    const hashtagMatch = match[3];

    // Push preceding text segment
    if (matchStart > lastIndex) {
      elements.push(text.substring(lastIndex, matchStart));
    }

    if (urlMatch) {
      // Clean trailing punctuation like . , ! ? )
      const cleanUrl = urlMatch.replace(/[.,)!?]+$/, '');
      const trailing = urlMatch.substring(cleanUrl.length);
      const targetUrl = normalizeUrl(cleanUrl);

      elements.push(
        <a
          key={`url-${matchStart}-${cleanUrl}`}
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={urlClassName}
          onClick={(e) => e.stopPropagation()}
        >
          {cleanUrl}
        </a>
      );
      if (trailing) {
        elements.push(trailing);
      }
    } else if (mentionMatch) {
      elements.push(
        <Link
          key={`mention-${matchStart}-${mentionMatch}`}
          to={getProfileUrl(mentionMatch)}
          className={mentionClassName}
          onClick={(e) => e.stopPropagation()}
        >
          @{mentionMatch}
        </Link>
      );
    } else if (hashtagMatch) {
      elements.push(
        <Link
          key={`hashtag-${matchStart}-${hashtagMatch}`}
          to={`/search?q=${encodeURIComponent('#' + hashtagMatch)}`}
          className={hashtagClassName}
          onClick={(e) => e.stopPropagation()}
        >
          #{hashtagMatch}
        </Link>
      );
    }

    lastIndex = matchStart + fullMatch.length;
  }

  // Push remaining text after the last match
  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return <span className={className}>{elements}</span>;
};

export default FormattedText;
