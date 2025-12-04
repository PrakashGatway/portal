import React, { useState, useMemo, useEffect } from 'react';

interface TableAnalysisSectionProps {
  qDoc: any;
  di: any;
  answers: any;
  isCompleted: boolean;
  updateDiAnswers: (updater: (prev: any) => any) => void;
}

export const TableAnalysisSection: React.FC<TableAnalysisSectionProps> = ({
  qDoc,
  di,
  answers,
  isCompleted,
  updateDiAnswers
}) => {
  const table = di.tableAnalysis?.table;
  const statements = di.tableAnalysis?.statements || [];

  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSortChange = (columnName: string) => {
    if (sortBy === columnName) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnName);
      setSortDirection('asc');
    }
  };

  // Sort the rows based on current sort settings
  const sortedRows = useMemo(() => {
    if (!table || !sortBy) return table.rows || [];

    const columnIndex = table.columns.findIndex(col => col === sortBy);
    if (columnIndex === -1) return table.rows || [];

    return [...(table.rows || [])].sort((a, b) => {
      const aValue = a.cells[columnIndex];
      const bValue = b.cells[columnIndex];

      // Try to convert to number for numeric comparison
      const aNum = parseFloat(aValue);
      const bNum = parseFloat(bValue);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // Fallback to string comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [table, sortBy, sortDirection]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Panel - Stimulus and Table */}
      <div className="space-y-4">
        {qDoc.stimulus && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {qDoc.stimulus}
            </div>
          </div>
        )}

        {table && (
          <div className="space-y-1">
            <select
              className="text-sm border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={sortBy || ""}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="">Select column...</option>
              {table.columns.map((col: string, idx: number) => (
                <option key={idx} value={col}>
                  {col}
                </option>
              ))}
            </select>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="text-sm border">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80">
                    {table.columns.map((col: string, idx: number) => (
                      <th
                        key={idx}
                        className={`py-1 px-1 border-r border-slate-200 dark:border-slate-700 last:border-r-0 font-medium text-slate-700 dark:text-slate-300 ${idx === 0 ? 'text-left' : 'text-center'}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>{col}</span>
                          {sortBy === col && (
                            <span className="text-xs opacity-70">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row: any, rowIndex: number) => (
                    <tr
                      key={row.id || rowIndex}
                      className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {row.cells.map((cell: string, cellIndex: number) => (
                        <td
                          key={cellIndex}
                          className={`py-1 px-1 border-r border-slate-100 dark:border-slate-800 last:border-r-0 ${cellIndex === 0 ? 'text-left font-medium text-slate-800 dark:text-slate-200' : 'text-center text-slate-600 dark:text-slate-300'}`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Question Text and Statements Table */}
      <div className="space-y-2">
        {qDoc?.questionText && (
          <div className="text-base text-slate-600 dark:text-slate-400" dangerouslySetInnerHTML={{ __html: qDoc?.questionText }} />
        )}

        {statements.length > 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
            <table className="">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80">
                  <th className="py-3 px-4 text-center font-medium text-slate-700 dark:text-slate-300">
                    True
                  </th>
                  <th className="py-3 px-4 text-center font-medium text-slate-700 dark:text-slate-300">
                    False
                  </th>
                  <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 text-left font-medium text-slate-700 dark:text-slate-300">
                    Statement
                  </th>
                </tr>
              </thead>
              <tbody>
                {statements.map((st: any) => {
                  const current = answers.tableAnalysis?.[st.id] || null;

                  return (
                    <tr
                      key={st.id}
                      className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          <input
                            type="radio"
                            id={`true-${st.id}`}
                            name={`statement-${st.id}`}
                            checked={current === "true"}
                            disabled={isCompleted}
                            onChange={() =>
                              updateDiAnswers((prev) => ({
                                ...prev,
                                tableAnalysis: {
                                  ...(prev.tableAnalysis || {}),
                                  [st.id]: "true",
                                },
                              }))
                            }
                            className="h-4 w-4 text-emerald-600 border-slate-300 dark:border-slate-600 focus:ring-emerald-500 dark:focus:ring-emerald-400 dark:bg-slate-700"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          <input
                            type="radio"
                            id={`false-${st.id}`}
                            name={`statement-${st.id}`}
                            checked={current === "false"}
                            disabled={isCompleted}
                            onChange={() =>
                              updateDiAnswers((prev) => ({
                                ...prev,
                                tableAnalysis: {
                                  ...(prev.tableAnalysis || {}),
                                  [st.id]: "false",
                                },
                              }))
                            }
                            className="h-4 w-4 text-rose-600 border-slate-300 dark:border-slate-600 focus:ring-rose-500 dark:focus:ring-rose-400 dark:bg-slate-700"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-800 align-top">
                        <div className="text-sm text-slate-800 dark:text-slate-200">
                          {st.text}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


interface MultiSourceComponentProps {
  di: any;
  answers: any;
  isCompleted: boolean;
  updateDiAnswers: (updater: (prev: any) => any) => void;
  qDoc?: any;
}

export const MultiSourceComponent: React.FC<MultiSourceComponentProps> = ({
  di,
  answers,
  isCompleted,
  updateDiAnswers,
  qDoc
}) => {
  const tabs = di.multiSource?.tabs || [];
  const statements = di.multiSource?.statements || [];
  const [activeTabId, setActiveTabId] = useState<string | null>(
    tabs[0].id
  );
  useEffect(() => {
    if (tabs.length > 0 ) {
     setActiveTabId(tabs[0].id);
    }    
  }, [tabs]);   



  if (!tabs.length && !statements.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-2">
        {tabs.length > 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              {tabs.map((tab: any) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${activeTabId === tab.id
                    ? "bg-yellow-500 text-white border-b-2 border-yellow-600"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                >
                  {tab.title}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 overflow-auto">
              {tabs.map((tab: any) => (
                <div
                  key={tab.id}
                  className={`${activeTabId === tab.id ? 'block' : 'hidden'
                    }`}
                >
                  <div className="text-base max-h-[420px] leading-relaxed text-slate-700 dark:text-slate-300"
                    dangerouslySetInnerHTML={{ __html: tab.contentHtml }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Statements */}
      <div className="space-y-2">
        {qDoc?.questionText && (
          <div className="text-base text-slate-600 dark:text-slate-400" dangerouslySetInnerHTML={{ __html: qDoc?.questionText }} />
        )}

        {statements.length > 0 && (
          <table className="">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80">
                <th className="py-3 px-4 text-center font-medium text-slate-700 dark:text-slate-300">
                  Yes
                </th>
                <th className="py-3 px-4 text-center font-medium text-slate-700 dark:text-slate-300">
                  No
                </th>
                <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-700 text-left font-medium text-slate-700 dark:text-slate-300">
                </th>
              </tr>
            </thead>
            <tbody>
              {statements.map((st: any) => {
                const current = answers.multiSource?.[st.id] || null;

                return (
                  <tr
                    key={st.id}
                    className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <input
                          type="radio"
                          id={`yes-${st.id}`}
                          name={`statement-${st.id}`}
                          checked={current === "yes"}
                          disabled={isCompleted}
                          onChange={() =>
                            updateDiAnswers((prev) => ({
                              ...prev,
                              multiSource: {
                                ...(prev.multiSource || {}),
                                [st.id]: "yes",
                              },
                            }))
                          }
                          className="h-4 w-4 text-emerald-600 border-slate-300 dark:border-slate-600 focus:ring-emerald-500 dark:focus:ring-emerald-400 dark:bg-slate-700"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <input
                          type="radio"
                          id={`no-${st.id}`}
                          name={`statement-${st.id}`}
                          checked={current === "no"}
                          disabled={isCompleted}
                          onChange={() =>
                            updateDiAnswers((prev) => ({
                              ...prev,
                              multiSource: {
                                ...(prev.multiSource || {}),
                                [st.id]: "no",
                              },
                            }))
                          }
                          className="h-4 w-4 text-rose-600 border-slate-300 dark:border-slate-600 focus:ring-rose-500 dark:focus:ring-rose-400 dark:bg-slate-700"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-800 align-top">
                      <div className="text-sm text-slate-800 dark:text-slate-200">
                        {st.text}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
