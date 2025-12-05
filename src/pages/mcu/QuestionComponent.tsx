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
            <div className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: qDoc?.stimulus }} />
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
    if (tabs.length > 0) {
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


import { Save } from 'lucide-react';
import Button from '../../components/ui/button/Button';

export const IntroScreen = ({
  introPage,
  setIntroPage,
  onContinue
}: any) => {
  const introPages = [
    {
      title: "Introduction",
      content: (
        <>
          <p className="mb-4">
            The GMAT Official Practice Exams are a simulation of the real GMAT™ exam. While they do use the same scoring algorithm as the actual GMAT™ exam, there are some differences between the practice exams and the real exam which are detailed on the following screens.
          </p>
          <p className="mb-4">
            We recommend that all test takers review the tutorial content provided within the practice exams at least one time within 3 days of your exam day so the information is fresh in your mind.
          </p>
          <p className="mb-4">
            Click <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> to continue.
          </p>
          <p>
            The GMAT™ exam is owned by the Graduate Management Admission Council (GMAC), including the copyrights for all GMAT questions in the test and prep materials.
          </p>
        </>
      ),
    },
    {
      title: "Differences between GMAT Official Practice Exams and the GMAT™ Exam",
      content: (
        <>
          <p className="mb-4">
            Optional break screens are not timed in GMAT Official Practice Exams, but are timed in the actual GMAT™ exam. For more information about the length of optional breaks, refer to www.mba.com. During the actual GMAT™ exam, if you exceed the time allowed for an optional break, the extra time used will be deducted from the time available to complete the next section of the exam.
          </p>
          <p className="mb-4">
            The <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">⬇ Save for Later</span> button is available in the practice exams, but not available during the GMAT™ exam.
          </p>
          <p className="mb-4">
            The <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">⏸ Pause</span> button is available in the practice exams but is not available during the GMAT™ exam.
          </p>
          <p className="mb-4">
            After completing a GMAT Official Practice Exam, you will see section scores for the Data Insights, Quantitative Reasoning, and Verbal Reasoning sections.
          </p>
          <p className="mb-4">
            Keep in mind that the GMAT Official Practice Exams are meant to illustrate GMAT content and are not accurate predictors of performance on the GMAT™ exam.
          </p>
          <p className="mb-4 font-bold">Please note:</p>
          <p className="mb-4">
            If you are planning on taking the GMAT™ exam delivered online, there are additional steps you need to take to help ensure your computer meets the minimum requirements and to help ensure you have a smooth testing experience.
          </p>
          <p className="mb-4">
            For more information, please visit Plan for Exam Day for the GMAT™ exam delivered online on mba.com.
          </p>
          <p className="mb-4">
            The browser back button will not work during practice exams. Use the Save for Later option to navigate out of the exam.
          </p>
          <p>
            Click <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> to continue.
          </p>
        </>
      ),
    },
    {
      title: "GMAT Exam Nondisclosure Agreement and General Terms of Use",
      content: (
        <>
          <p className="mb-4">
            Before beginning the GMAT™ exam, you will be presented with Exam Check-In Confirmation, Candidate Name Confirmation, and Welcome Screens. You will be required to read and accept the GMAT™ exam Nondisclosure Agreement and General Terms of Use. If you do not agree with these terms, your exam will be canceled, and you will forfeit your entire test fee.
          </p>
          <p>
            Click <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> to continue.
          </p>
        </>
      ),
    },
    {
      title: "Tutorial",
      content: (
        <>
          <p className="mb-4">
            The following tutorial section will walk you through the navigation of screens and provide some helpful reminders. We recommend that all test takers review the tutorial content provided within the practice exams at least one time.
          </p>
          <p className="mb-4">
            When you take the GMAT™ exam, you will have <strong>two minutes</strong> to review the information in this tutorial before beginning the exam. If you have a timed accommodation, your extra time is noted on the clock timer in the upper right-hand corner.
          </p>
          <p className="mb-4 font-bold">
            In the GMAT Official Practice Exams, this tutorial is not timed, so you may want to spend extra time reviewing the tutorial screens.
          </p>
          <p>
            Click <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> to continue.
          </p>
        </>
      ),
    },
    {
      title: "Screen Layout and Navigation",
      content: (
        <>
          <p className="mb-4">
            For any timed section of the exam, you can see your time remaining for that section in the upper right corner by the <span className="inline-block bg-yellow-400 w-6 h-6 rounded flex items-center justify-center text-black font-bold">⏱</span> icon.
          </p>
          <p className="mb-4">
            Just below the time remaining, you will see <span className="bg-gray-700 text-white px-1 py-0.5 rounded dark:bg-gray-600">2 of 7</span>. This indicates that you are viewing the second of 7 questions or screens.
          </p>
          <p className="mb-4">
            You can minimize the time remaining and the question number reminders by clicking on them. To restore them, click on the <span className="inline-block bg-yellow-400 w-6 h-6 rounded flex items-center justify-center text-black font-bold">⏱</span> and <span className="inline-block bg-gray-700 w-6 h-6 rounded flex items-center justify-center text-white font-bold">📄</span> icons. When you have five (5) minutes remaining, you will see an alert message notifying you of the time left in the section.
          </p>
          <p className="mb-4">
            You can bookmark a question for review by clicking the <span className="inline-block bg-gray-700 w-6 h-6 rounded flex items-center justify-center text-white font-bold">🔖</span> icon. When a question is bookmarked, the icon will be filled in: <span className="inline-block bg-gray-700 w-6 h-6 rounded flex items-center justify-center text-white font-bold">📌</span>. Clicking the icon again will remove the bookmark.
          </p>
          <p className="mb-4">
            On each screen, the navigation buttons and functions can be selected by:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Clicking the appropriate button with the mouse</li>
            <li>Using the Tab key to move through the options and pressing the space bar to select an option,</li>
            <li>Using the shortcut keys (Alt + underlined shortcut letter)</li>
          </ul>
          <p className="mb-4">
            <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">❓ Help</span> provides access to the information in this tutorial, as well as specific testing and section instructions.
          </p>
          <p className="mb-4">
            The <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">⏸ Pause</span> <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">⬇ Save for Later</span> buttons are available in the Data Insights, Quantitative, and Verbal section of the Practice Exams only, but are NOT available in the GMAT™ exam.
          </p>
          <p>
            Click <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> to continue.
          </p>
        </>
      ),
    },
  ];

  const isLastPage = introPage === 5;

  const currentPage = introPages[introPage - 1];

  return (
    <div className="w-full flex flex-col">
      {/* Main Content Area */}
      <div className={`w-full max-w-7xl mx-auto bg-white dark:bg-slate-900 p-6 border-t-4 border-blue-600 dark:border-blue-500 flex-grow`}>
        <h1 className="text-xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">
          {currentPage.title}
        </h1>
        <div className="text-base leading-relaxed text-slate-800 dark:text-slate-200 space-y-4">
          {currentPage.content}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                disabled={true}
              >
                <Save className="h-4 w-4" />
                Save Progress
              </Button>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {introPage > 1 && (
                  <button
                    className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => setIntroPage(prev => Math.max(1, prev - 1))}
                  >
                    Previous
                  </button>
                )}
                <button
                  className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => {
                    if (isLastPage) {
                      onContinue();
                    } else {
                      setIntroPage(prev => Math.min(5, prev + 1));
                    }
                  }}
                >
                  {isLastPage ? "Continue to Section Order" : "Next →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


interface SelectOrderScreenProps {
  moduleSequenceOptions: Array<{
    index: number;
    order: number[];
    labels: Array<{ order: number; name: string }>;
  }>;
  selectedSequenceIndex: number | null;
  setSelectedSequenceIndex: (index: number | null) => void;
  onStartTest: () => void;
}

const MODULE_PERMUTATIONS: number[][] = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

export const SelectOrderScreen: React.FC<SelectOrderScreenProps> = ({
  moduleSequenceOptions,
  selectedSequenceIndex,
  setSelectedSequenceIndex,
  onStartTest
}) => {
  return (
    <div className="w-full flex flex-col">
      {/* Main Content Area */}
      <div className={`w-full max-w-7xl mx-auto bg-white dark:bg-slate-900 p-6 border-t-4 border-blue-600 dark:border-blue-500 flex-grow`}>
        <h1 className="text-xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">
          Select Section Order
        </h1>

        <div className="text-base leading-relaxed text-slate-800 dark:text-slate-200 space-y-4">
          <p className="font-bold">
            Select the order in which the exam sections are to be administered.
          </p>
          <p className="text-red-600 dark:text-red-400">
            You have one (1) minute to make your selection in the GMAT exam. If you do not make your selection within one (1) minute, the first option listed will be selected, and you will take the exam in the following order: Quantitative Reasoning, Verbal Reasoning, Data Insights.
          </p>
          <p className="text-red-600 dark:text-red-400">
            Please note that in the GMAT Official Practice Exams, this screen is not timed.
          </p>
          <p>
            Six different section order options are presented below. Once you select your section order, you must view ALL questions in each section, in the order you selected, before moving to the next section. You will NOT be able to return to this screen.
          </p>

          {/* Grid for 6 options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {moduleSequenceOptions.map((seq, idx) => (
              <div
                key={seq.index}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <input
                  type="radio"
                  id={`sequence-${idx}`}
                  name="sectionOrder"
                  checked={selectedSequenceIndex === seq.index}
                  onChange={() => setSelectedSequenceIndex(seq.index)}
                  className="h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-slate-700"
                />
                <label
                  htmlFor={`sequence-${idx}`}
                  className="space-y-1 text-slate-700 dark:text-slate-200 cursor-pointer flex-1"
                >
                  {seq.labels.map((item, labelIdx) => (
                    <div
                      key={labelIdx}
                      className="text-sm font-medium text-slate-800 dark:text-slate-100"
                    >
                      {item.name}
                    </div>
                  ))}
                </label>
              </div>
            ))}
          </div>

          <p className="mt-6">
            Click the <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> button to start the exam. You will begin the GMAT™ exam on the next screen.
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                disabled={true}
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                size="sm"
                className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800"
                onClick={onStartTest}
                disabled={selectedSequenceIndex === null}
              >
                Start GMAT Test
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SectionInstructionsScreenProps {
  sectionName: string;
  sectionDuration: number;
  questionCount: number;
  onNext: () => void;
}

export const SectionInstructionsScreen: React.FC<SectionInstructionsScreenProps> = ({
  sectionName,
  sectionDuration,
  questionCount,
  onNext
}) => {
  const getSectionInstructions = () => {
    switch (sectionName) {
      case "Quantitative Reasoning":
        return (
          <>
            <p className="mb-4">
              When you take the GMAT™ exam you will have a specific amount of time to review these instructions. In the GMAT Official Practice Exams, this instruction screen is not timed, so you may want to spend extra time reviewing it.
            </p>
            <p className="mb-4">
              You are about to start the Quantitative Reasoning section of the exam. You will have <strong>{sectionDuration} minutes</strong> to complete this section, including reviewing and editing answers. If you have a timed accommodation, your extra time will be noted on the exam clock timer in the upper right-hand corner.
            </p>
            <p className="mb-4">
              In this section, you will be presented with <strong>{questionCount} questions</strong>.
            </p>
            <p className="mb-4">
              There are two types of questions in the Quantitative section: Problem Solving and Data Sufficiency.
            </p>
            <p className="mb-4">
              For each question, select the best answer of the choices given.
            </p>
            <p className="mb-4">
              At any point, you can read the directions by clicking on HELP.
            </p>
            <p className="mb-4">
              Each of the <strong>Problem Solving</strong> questions is designed to measure your ability to reason quantitatively, solve quantitative problems, and interpret graphic data.
            </p>
            <p className="mb-4">
              Each of the <strong>Data Sufficiency</strong> questions is designed to measure your ability to analyze a quantitative problem, recognize which data is relevant, and determine at what point there is enough data to solve the problem.
            </p>
            <p>
              Click <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> to begin the Quantitative Reasoning section.
            </p>
          </>
        );
      case "Verbal Reasoning":
        return (
          <>
            <p className="mb-4">
              When you take the GMAT™ exam you will have a specific amount of time to review these instructions. In the GMAT Official Practice Exams, this instruction screen is not timed, so you may want to spend extra time reviewing it.
            </p>
            <p className="mb-4">
              You are about to start the Verbal Reasoning section of the exam. You will have <strong>{sectionDuration} minutes</strong> to complete this section, including reviewing and editing answers. If you have a timed accommodation, your extra time will be noted on the exam clock timer in the upper right-hand corner.
            </p>
            <p className="mb-4">
              In this section, you will be presented with <strong>{questionCount} questions</strong>.
            </p>
            <p className="mb-4">
              There are two types of questions in the Verbal section: Critical Reasoning and Reading Comprehension.
            </p>
            <p className="mb-4">
              For each question, select the best answer of the choices given.
            </p>
            <p className="mb-4">
              At any point, you can read the directions by clicking on HELP.
            </p>
            <p className="mb-4">
              Each of the <strong>Critical Reasoning</strong> questions is based on a short argument, a set of statements, or a plan of action.
            </p>
            <p className="mb-4">
              Each of the <strong>Reading Comprehension</strong> questions is based on the content of a passage. After reading the passage, answer all questions pertaining to it on the basis of what is <strong>stated</strong> or <strong>implied</strong> in the passage.
            </p>
            <p>
              Click <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> to begin the Verbal Reasoning section.
            </p>
          </>
        );
      case "Data Insights":
        return (
          <>
            <p className="mb-4">
              When you take the GMAT™ exam you will have a specific amount of time to review these instructions. In the GMAT Official Practice Exams, this instruction screen is not timed, so you may want to spend extra time reviewing it.
            </p>
            <p className="mb-4">
              You are about to start the Data Insights section of the exam. You will have <strong>{sectionDuration} minutes</strong> to complete this section, including reviewing and editing answers. If you have a timed accommodation, your extra time will be noted on the exam clock timer in the upper right-hand corner.
            </p>
            <p className="mb-4">
              In this section, you will be presented with <strong>{questionCount} questions</strong>.
            </p>
            <p className="mb-4">
              There are five types of questions in the Data Insights section: Table Analysis, Graphics Interpretation, Multi-Source Reasoning, Two-Part Analysis, and Data Sufficiency.
            </p>
            <p className="mb-4">
              For each question, select the best answer of the choices given.
            </p>
            <p className="mb-4">
              At any point, you can read the directions by clicking on HELP.
            </p>
            <p className="mb-4">
              <strong>Table Analysis</strong> questions require you to sort and analyze a table of data, similar to a spreadsheet, to determine whether certain conditions are met.
            </p>
            <p className="mb-4">
              <strong>Graphics Interpretation</strong> questions require you to interpret a graph or graphical image.
            </p>
            <p className="mb-4">
              <strong>Multi-Source Reasoning</strong> questions require you to examine data from multiple sources, such as tables, graphics, and text passages, to answer questions.
            </p>
            <p className="mb-4">
              <strong>Two-Part Analysis</strong> questions involve two components that must be selected from a list of possible answers.
            </p>
            <p className="mb-4">
              <strong>Data Sufficiency</strong> questions are designed to measure your ability to analyze a quantitative problem, recognize which data is relevant, and determine at what point there is enough data to solve the problem.
            </p>
            <p>
              Click <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> to begin the Data Insights section.
            </p>
          </>
        );
      default:
        return (
          <>
            <p className="mb-4">
              When you take the GMAT™ exam you will have a specific amount of time to review these instructions. In the GMAT Official Practice Exams, this instruction screen is not timed, so you may want to spend extra time reviewing it.
            </p>
            <p className="mb-4">
              You are about to start the {sectionName} section of the exam. You will have <strong>{sectionDuration} minutes</strong> to complete this section, including reviewing and editing answers. If you have a timed accommodation, your extra time will be noted on the exam clock timer in the upper right-hand corner.
            </p>
            <p className="mb-4">
              In this section, you will be presented with <strong>{questionCount} questions</strong>.
            </p>
            <p>
              Click <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> to begin the {sectionName} section.
            </p>
          </>
        );
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Main Content Area */}
      <div className={`w-full max-w-7xl mx-auto bg-white dark:bg-slate-900 p-6 border-t-4 border-blue-600 dark:border-blue-500 flex-grow`}>
        <h1 className="text-xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">
          {sectionName} Instructions
        </h1>

        <div className="text-base leading-relaxed text-slate-800 dark:text-slate-200 space-y-4">
          {getSectionInstructions()}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                disabled={true}
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={onNext}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// components/gmat/QuestionBody.tsx

interface QuestionBodyProps {
  qDoc: {
    _id: string;
    questionText: string;
    questionType: string;
    difficulty?: string;
    stimulus?: string;
    options?: {
      label?: string;
      text: string;
    }[];
    marks?: number;
    negativeMarks?: number;
    dataInsights?: any;
  } | null;
  currentQuestion: {
    answerOptionIndexes: number[];
    answerText?: string;
    isAnswered: boolean;
    order: number;
    markedForReview: boolean;
    timeSpentSeconds: number;
    questionDoc?: any;
  } | null;
  isCompleted: boolean;
  onOptionClick: (optionIndex: number) => void;
  onTextAnswerChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  getDiAnswers: () => any;
  updateDiAnswers: (updater: (prev: any) => any) => void;
}

const QuestionBody: React.FC<QuestionBodyProps> = ({
  qDoc,
  currentQuestion,
  isCompleted,
  onOptionClick,
  onTextAnswerChange,
  getDiAnswers,
  updateDiAnswers
}) => {
  if (!qDoc || !currentQuestion) return null;

  const isMCQ =
    !!qDoc.options && qDoc.options.length > 0 &&
    qDoc.questionType !== "gmat_data_insights";

  const isRC = qDoc.questionType === "gmat_verbal_rc";
  const isEssayLike =
    qDoc.questionType === "essay" ||
    qDoc.questionType === "gre_analytical_writing";

  const isDataInsights = qDoc.questionType === "gmat_data_insights";

  // GMAT Verbal RC: split passage left, question right
  if (isRC) {
    const passage = qDoc.stimulus || ""
    const questionHtml = qDoc.questionText || "";

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Passage */}
        <div className="max-h-[460px] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-2 text- leading-relaxed text-slate-700 dark:text-slate-300">
          <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg">
            {passage}
          </div>
        </div>

        {/* Right: Question + options */}
        <div>
          {questionHtml && (
            <div className="mb-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
              <div
                className="text font-semibold leading-relaxed text-slate-800 dark:text-slate-100"
                dangerouslySetInnerHTML={{ __html: questionHtml }}
              />
            </div>
          )}

          {isMCQ && (
            <div className="space-y-2">
              {qDoc.options!.map((opt, idx) => {
                const selected =
                  currentQuestion.answerOptionIndexes.includes(
                    idx
                  );
                const label =
                  opt.label ||
                  String.fromCharCode("A".charCodeAt(0) + idx);
                return (
                  <button
                    key={idx}
                    onClick={() => onOptionClick(idx)}
                    disabled={isCompleted}
                    className={`flex w-full items-start gap-4 rounded-2xl border-1 px-4 py-2 text-left transition-all duration-200 ${selected
                      ? "border-indigo-200 bg-indigo-100 dark:bg-indigo-500/20"
                      : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-400"
                      } ${isCompleted
                        ? "cursor-not-allowed opacity-80"
                        : "cursor-pointer"
                      }`}
                  >
                    <div
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2  text-xs font-bold transition-all ${selected
                        ? "border-indigo-500 bg-indigo-500 text-white shadow-sm"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        }`}
                    >
                      {label}
                    </div>
                    <div className="flex-1 text-base font-medium text-slate-700 dark:text-slate-200">
                      {opt.text}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Data Insights: handle subtypes with simple controls
  if (isDataInsights && qDoc.dataInsights) {
    const di = qDoc.dataInsights;
    const answers = getDiAnswers();

    const renderTwoPart = () => {
      const columns = di.twoPart?.columns || [];
      const options = di.twoPart?.options || [];

      return (
        <div className="space-y-4">

          {qDoc.questionText && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4 text-base text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: qDoc?.questionText }} />
          )}

          <div className="overflow-x-auto">
            <table className=" border-collapse border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800">
                  {columns.map((col: any) => (
                    <th
                      key={col.id}
                      className="py-2 px-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700 last:border-r-0"
                    >
                      {col.title}
                    </th>
                  ))}
                  <th className="py-2 px-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700 last:border-r-0">

                  </th>
                </tr>
              </thead>
              <tbody>
                {options.map((option: any, optionIndex: number) => (
                  <tr
                    key={option.id}
                    className={`border-t border-slate-200 dark:border-slate-700 ${optionIndex % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50'}`}
                  >
                    {columns.map((col: any, colIndex: number) => {
                      const currentAnswer =
                        answers.twoPart?.[col.id] || "";
                      const isSelected =
                        currentAnswer === option.id;

                      return (
                        <td
                          key={`${col.id}-${option.id}`}
                          className="py-2 px-3 text-sm border-r border-slate-200 dark:border-slate-700 last:border-r-0"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id={`twoPart-${col.id}-${option.id}`}
                              name={`twoPart-${col.id}`}
                              value={option.id}
                              checked={isSelected}
                              disabled={isCompleted}
                              onChange={(e) =>
                                updateDiAnswers((prev: any) => ({
                                  ...prev,
                                  twoPart: {
                                    ...(prev.twoPart || {}),
                                    [col.id]: e.target.value,
                                  },
                                }))
                              }
                              className="h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-slate-700"
                            />

                          </div>
                        </td>
                      );

                    })}
                    <td className="py-2 px-3 text-sm border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                      {option.label}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    const renderGraphics = () => {
      const prompt = di.graphics?.prompt;
      const dropdowns = di.graphics?.dropdowns || [];

      const processPrompt = (text: string) => {
        const parts = text.split(/(\{\{\d+\}\})/);
        return parts.map((part, index) => {
          if (part.match(/\{\{\d+\}\}/)) {
            const dropdownNumber = parseInt(part.match(/\d+/)?.[0] || '0');
            const dd = dropdowns.find(d => d.id === `dropdown_${dropdownNumber}`) ||
              dropdowns[dropdownNumber - 1]; // Fallback to index-based if id doesn't match

            if (dd) {
              const currentIndex = answers.graphics?.[dd.id] ?? -1;

              return (
                <select
                  key={`dropdown-${dropdownNumber}-${index}`}
                  className="mx-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-800 dark:text-slate-100 font-medium"
                  disabled={isCompleted}
                  value={currentIndex >= 0 ? currentIndex : ""}
                  onChange={(e) =>
                    updateDiAnswers((prev: any) => ({
                      ...prev,
                      graphics: {
                        ...(prev.graphics || {}),
                        [dd.id]: Number(e.target.value),
                      },
                    }))
                  }
                >
                  <option value="">Select</option>
                  {dd.options.map((opt: string, idx: number) => (
                    <option key={idx} value={idx}>
                      {opt}
                    </option>
                  ))}
                </select>
              );
            } else {
              return part; // Return the placeholder if no dropdown found
            }
          }
          return part;
        });
      };

      return (
        <div className="space-y-2">
          {qDoc.questionText && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4 text-base text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: qDoc?.questionText }} />
          )}

          {prompt && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4 text-base text-slate-700 dark:text-slate-300">
              {processPrompt(prompt)}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-3 mt-2">
        {di.subtype === "multi_source_reasoning" && (
          <MultiSourceComponent
            di={di}
            answers={answers}
            isCompleted={isCompleted}
            updateDiAnswers={updateDiAnswers}
          />
        )}
        {di.subtype === "table_analysis" && (
          <TableAnalysisSection
            qDoc={qDoc}
            di={di}
            answers={answers}
            isCompleted={isCompleted}
            updateDiAnswers={updateDiAnswers}
          />
        )}
        {di.subtype === "two_part_analysis" && renderTwoPart()}
        {di.subtype === "graphics_interpretation" && renderGraphics()}
      </div>
    );
  }

  // Default GMAT / GRE / SAT MCQ
  if (isMCQ) {
    return (
      <>
        {qDoc.stimulus && (
          <div className="mb-2 max-h-60 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
            <div className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: qDoc?.stimulus }} />
          </div>
        )}

        <div className="mb-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
          <div
            className="text-base font-semibold leading-relaxed text-slate-800 dark:text-slate-100"
            dangerouslySetInnerHTML={{ __html: qDoc.questionText }}
          />
        </div>

        <div className="space-y-1 ml-1">
          <div className="space-y-2">
            {qDoc.options!.map((opt, idx) => {
              const selected =
                currentQuestion.answerOptionIndexes.includes(idx);
              const label =
                opt.label ||
                String.fromCharCode("A".charCodeAt(0) + idx);
              return (
                <button
                  key={idx}
                  onClick={() => onOptionClick(idx)}
                  disabled={isCompleted}
                  className={`flex w-full items-start gap-4 rounded-2xl border-1 px-4 py-2 text-left transition-all duration-200 ${selected
                    ? "border-indigo-200 bg-indigo-100 dark:bg-indigo-500/20"
                    : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-400"
                    } ${isCompleted
                      ? "cursor-not-allowed opacity-80"
                      : "cursor-pointer"
                    }`}
                >
                  <div
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full  border-2 text-xs font-bold transition-all ${selected
                      ? "border-indigo-500 bg-indigo-500 text-white shadow-sm"
                      : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                  >
                    {label}
                  </div>
                  <div className="flex-1 text-base font-medium text-slate-700 dark:text-slate-200">
                    {opt.text}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  // Essay / numeric / others – text input or textarea
  return (
    <>
      {qDoc.stimulus && (
        <div className="mb-3 max-h-60 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <div className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: qDoc?.stimulus }} />
        </div>
      )}

      <div className="mb-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
        <div
          className="text-lg font-semibold leading-relaxed text-slate-800 dark:text-slate-100"
          dangerouslySetInnerHTML={{ __html: qDoc.questionText }}
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Your Answer
        </label>
        {isEssayLike ? (
          <textarea
            className="w-full min-h-[160px] rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base text-slate-900 dark:text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            value={currentQuestion.answerText || ""}
            onChange={onTextAnswerChange}
            disabled={isCompleted}
            placeholder="Type your response here..."
          />
        ) : (
          <input
            type="text"
            className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base text-slate-900 dark:text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            value={currentQuestion.answerText || ""}
            onChange={onTextAnswerChange}
            disabled={isCompleted}
            placeholder="Type your answer here..."
          />
        )}
      </div>
    </>
  );
};

export default React.memo(QuestionBody)
