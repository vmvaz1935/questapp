import React, { useState } from 'react';

interface Tab {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface CollapsibleTabsProps {
  tabs: Tab[];
}

const CollapsibleTabs: React.FC<CollapsibleTabsProps> = ({ tabs }) => {
  const [openTabs, setOpenTabs] = useState<Set<string>>(new Set());

  const toggleTab = (tabId: string) => {
    setOpenTabs(prev => {
      const next = new Set(prev);
      if (next.has(tabId)) {
        next.delete(tabId);
      } else {
        next.add(tabId);
      }
      return next;
    });
  };

  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {tabs.map((tab) => {
        if (!tab || !tab.id) return null;
        const isOpen = openTabs.has(tab.id);
        return (
          <div key={tab.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleTab(tab.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors rounded-lg"
            >
              <span className="font-medium text-gray-900 dark:text-white">{tab.title}</span>
              <svg
                className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {tab.content}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CollapsibleTabs;

