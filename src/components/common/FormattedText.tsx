import React from 'react';
import { Link } from 'react-router-dom';
import { getProfileUrl } from '../../utils/user';

interface FormattedTextProps {
  text?: string | null;
  className?: string;
  mentionClassName?: string;
  hashtagClassName?: string;
}

/**
 * FormattedText component that detects and renders clickable @mentions and #hashtags
 * with routing to user profiles and search tags.
 */
export const FormattedText: React.FC<FormattedTextProps> = ({
  text,
  className = '',
  mentionClassName = 'text-blue-600 dark:text-[#0095F6] font-semibold hover:underline cursor-pointer inline-flex items-center',
  hashtagClassName = 'text-blue-600 dark:text-[#0095F6] font-semibold hover:underline cursor-pointer inline-flex items-center',
}) => {
  if (!text) return null;

  // Match @username or #hashtag, ensuring @ is not part of an email
  const regex = /(?:^|(?<=[\s([{"']))(?:@([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)|#([\w\p{L}_-]+))/gu;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchStart = match.index;
    const fullMatch = match[0];
    const mention = match[1];
    const hashtag = match[2];

    // Push preceding text segment
    if (matchStart > lastIndex) {
      elements.push(text.substring(lastIndex, matchStart));
    }

    if (mention) {
      elements.push(
        <Link
          key={`mention-${matchStart}-${mention}`}
          to={getProfileUrl(mention)}
          className={mentionClassName}
          onClick={(e) => e.stopPropagation()}
        >
          @{mention}
        </Link>
      );
    } else if (hashtag) {
      elements.push(
        <Link
          key={`hashtag-${matchStart}-${hashtag}`}
          to={`/search?q=${encodeURIComponent('#' + hashtag)}`}
          className={hashtagClassName}
          onClick={(e) => e.stopPropagation()}
        >
          #{hashtag}
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
