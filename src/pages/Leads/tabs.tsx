import { motion, LayoutGroup } from "framer-motion";
import { LucideIcon } from "lucide-react";

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  className = "",
}: TabsProps) {
  return (
    <nav className={className}>
      <LayoutGroup>
        <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                layout
                onClick={() => onChange(tab.id)}
                className={`relative py-3 px-4 font-medium text-sm flex items-center rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? "text-blue-600 bg-white shadow-sm dark:bg-gray-900 dark:text-blue-400"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="tabBackground"
                    className="absolute inset-0 bg-white dark:bg-gray-900 rounded-lg shadow-sm -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {Icon && <Icon className="h-4 w-4 mr-2" />}
                {tab.label}
              </motion.button>
            );
          })}
        </div>
      </LayoutGroup>
    </nav>
  );
}
