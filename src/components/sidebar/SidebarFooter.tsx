import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import clsx from 'clsx';

export interface SidebarFooterProps {
  className?: string;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ className }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <footer className={clsx('px-2 text-xs text-gray-400 dark:text-[#737373] leading-relaxed', className)}>
      <div className="flex flex-wrap gap-x-2 gap-y-1 mb-1">
        <Link to="/terms" className="hover:underline hover:text-gray-600 dark:hover:text-[#F5F5F5]">
          {language === 'vi' ? 'Điều khoản' : 'Terms'}
        </Link>
        <span>·</span>
        <Link to="/privacy" className="hover:underline hover:text-gray-600 dark:hover:text-[#F5F5F5]">
          {language === 'vi' ? 'Quyền riêng tư' : 'Privacy'}
        </Link>
        <span>·</span>
        <Link to="/help" className="hover:underline hover:text-gray-600 dark:hover:text-[#F5F5F5]">
          {language === 'vi' ? 'Trợ giúp' : 'Help'}
        </Link>
        <span>·</span>
        <button
          type="button"
          onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
          className="hover:underline text-[#004AC6] dark:text-[#0095F6] font-medium cursor-pointer"
        >
          {language === 'vi' ? 'English' : 'Tiếng Việt'}
        </button>
      </div>
      <p>© 2026 Mo3Studio. All rights reserved.</p>
    </footer>
  );
};

export default SidebarFooter;
