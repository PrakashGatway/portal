"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Bot, ChevronRight, Clock3,
  GraduationCap, HelpCircle, Loader2, MessageCircle, RotateCcw,
  Search, Send, Sparkles, StopCircle, User, X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const API_URL = "http://localhost:5000";

/* =========================================================
   MODERN OOSHAS THEME (Midnight & Emerald)
========================================================= */

const theme = {
  primary: "#0F172A",      // Deep Midnight Blue
  primaryLight: "#1E293B",
  accent: "#10B981",       // Emerald Green
  accentDark: "#059669",
  surface: "#F8FAFC",
  surfaceDark: "#0B1120",
};

/* =========================================================
   TOPICS
========================================================= */

const topics = [
  { id: "admissions", title: "Admissions", description: "Applications, eligibility & documents", icon: GraduationCap },
  { id: "study-abroad", title: "Study Abroad", description: "Universities, countries & programs", icon: BookOpen },
  { id: "tests", title: "Test Preparation", description: "IELTS, SAT, GRE, GMAT & more", icon: Sparkles },
  { id: "fees", title: "Fees & Scholarships", description: "Fees, funding & scholarships", icon: HelpCircle },
  { id: "visa", title: "Visa & Requirements", description: "Visa process & documents", icon: BookOpen },
];

/* =========================================================
   ARTICLES
========================================================= */

const articles = [
  {
    id: "study-germany",
    title: "How to Study in Germany",
    description: "Universities, eligibility, fees and application process.",
    category: "Study Abroad",
    readTime: "5 min",
    featured: true,
    content: `Germany is one of the most popular destinations for international students.\n\nStudents can choose from a wide range of bachelor's, master's and doctoral programs.\n\nBefore applying, check:\n\n• Academic eligibility\n• English language requirements\n• Program-specific requirements\n• Tuition and semester fees\n• Intake availability\n• Financial requirements\n• Visa requirements\n\nThe application process usually involves selecting a suitable program, checking admission requirements, preparing documents and submitting the application.\n\nAlways verify the current requirements of your selected university and program before applying.`,
  },
  {
    id: "ielts-requirements",
    title: "IELTS Requirements for Study Abroad",
    description: "Understand IELTS scores and admission requirements.",
    category: "IELTS",
    readTime: "4 min",
    content: `IELTS is commonly used to demonstrate English language proficiency.\n\nThe required score can vary depending on:\n\n• University\n• Program\n• Degree level\n• Country\n• Department\n\nSome programs may require a specific overall score while others may also have minimum scores for individual sections.\n\nAlways check the English language requirements of your selected program.`,
  },
  {
    id: "application-documents",
    title: "Documents Required for University Admission",
    description: "A practical guide to documents needed for applications.",
    category: "Admissions",
    readTime: "3 min",
    content: `University applications commonly require:\n\n• Academic transcripts\n• Degree certificates\n• Passport\n• English language test score\n• Statement of purpose\n• Resume / CV\n• Letters of recommendation\n\nThe exact requirements depend on the university and program.\n\nAlways verify the latest requirements before submitting your application.`,
  },
  {
    id: "scholarships",
    title: "Scholarships for International Students",
    description: "Understand scholarship and funding opportunities.",
    category: "Scholarships",
    readTime: "4 min",
    content: `Scholarships can help reduce the cost of studying abroad.\n\nCommon types include:\n\n• University scholarships\n• Government scholarships\n• Merit-based scholarships\n• Need-based scholarships\n• Research scholarships\n\nEligibility and deadlines vary by scholarship.\n\nCheck the specific scholarship requirements before applying.`,
  },
];

/* =========================================================
   ANIMATION
========================================================= */

const spring = { type: "spring", stiffness: 380, damping: 30 };

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055 } },
};

/* =========================================================
   COMPONENT
========================================================= */

export default function OoshasChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { id: "welcome", role: "assistant", content: "Hi! 👋 I'm Ooshas AI. I can help you with admissions, test preparation, universities, courses and study abroad." },
  ]);
  const [conversationId, setConversationId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("help");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [search, setSearch] = useState("");

  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);

  /* =========================================================
     SCROLL
  ========================================================= */

  useEffect(() => {
    if (view !== "chat") return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, view]);

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredArticles = articles.filter((article) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      article.title.toLowerCase().includes(query) ||
      article.description.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query)
    );
  });

  /* =========================================================
     ARTICLE
  ========================================================= */

  const openArticle = (article) => {
    setSelectedArticle(article);
    setView("article");
  };

  /* =========================================================
     TOPIC
  ========================================================= */

  const openTopic = (topic) => {
    setSearch("");
    const topicArticle = articles.find((article) =>
      article.category.toLowerCase().includes(topic.title.toLowerCase().split(" ")[0])
    );
    if (topicArticle) {
      setSelectedArticle(topicArticle);
      setView("article");
      return;
    }
    setMessage(`Tell me about ${topic.title}.`);
    setView("chat");
  };

  /* =========================================================
     START CHAT FROM ARTICLE
  ========================================================= */

  const startConversation = () => {
    setView("chat");
    if (selectedArticle) {
      setMessage(`I read "${selectedArticle.title}" but I still need help.`);
    }
  };

  /* =========================================================
     SEND MESSAGE
  ========================================================= */

  const sendMessage = async () => {
    const text = message.trim();
    if (!text || isStreaming) return;

    setMessage("");
    setError("");
    setView("chat");

    const userMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantId = crypto.randomUUID();
    const assistantMessage = { id: assistantId, role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`${API_URL}/api/chatbot/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: text,
          conversationId,
          articleId: selectedArticle?.id || null,
          articleTitle: selectedArticle?.title || null,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error("Failed to connect to chatbot");
      if (!response.body) throw new Error("Streaming is not supported");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const lines = event.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const rawData = line.replace("data:", "").trim();
            if (!rawData) continue;

            let data;
            try { data = JSON.parse(rawData); } catch { continue; }

            if (data.type === "conversation") setConversationId(data.conversationId);
            if (data.type === "token") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: msg.content + data.content } : msg
                )
              );
            }
            if (data.type === "complete") setIsStreaming(false);
            if (data.type === "error") {
              setError(data.message || "Something went wrong.");
              setIsStreaming(false);
            }
          }
        }
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.error(error);
      setError("Unable to connect to Ooshas AI.");
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  /* =========================================================
     STOP
  ========================================================= */

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  /* =========================================================
     NEW CHAT
  ========================================================= */

  const newConversation = () => {
    stopGeneration();
    setConversationId(null);
    setSelectedArticle(null);
    setMessages([
      { id: crypto.randomUUID(), role: "assistant", content: "Hi! 👋 I'm Ooshas AI. How can I help you today?" },
    ]);
    setView("chat");
    setError("");
  };

  /* =========================================================
     CLOSE
  ========================================================= */

  const closeChat = () => {
    stopGeneration();
    setIsOpen(false);
  };

  /* =========================================================
     KEYBOARD
  ========================================================= */

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* =====================================================
          CHAT WINDOW
      ===================================================== */}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 18 }}
            transition={spring}
            className="
              fixed bottom-4 right-4 z-[9999] flex
              h-[min(700px,calc(100vh-32px))] w-[calc(100vw-24px)]
              max-w-[410px] flex-col overflow-hidden
              rounded-[24px] border border-slate-200/80 bg-white
              shadow-[0_30px_90px_-20px_rgba(15,23,42,0.35)]
              dark:border-slate-800 dark:bg-[#0B1120]
              sm:right-6 sm:bottom-6
            "
          >
            {/* Top Accent */}
            <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-300" />

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="relative shrink-0 border-b border-slate-100/80 bg-white px-4 py-3.5 dark:border-slate-800/80 dark:bg-[#0B1120]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {view !== "help" && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { setView("help"); setSelectedArticle(null); }}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                    >
                      <ArrowLeft size={16} />
                    </motion.button>
                  )}

                  {/* AI Avatar */}
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                      <Bot size={20} />
                    </div>
                    <motion.span
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-[#0B1120]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Ooshas AI</h3>
                      <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        AI
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-400">Your 24/7 study assistant</p>
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  {view === "chat" && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={newConversation}
                      title="New chat"
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <RotateCcw size={14} />
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={closeChat}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X size={17} />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* =================================================
                HELP HOME
            ================================================= */}

            {view === "help" && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={stagger}
                className="min-h-0 flex-1 overflow-y-auto bg-slate-50 dark:bg-[#080E1A]"
              >
                {/* Hero */}
                <div className="relative overflow-hidden px-5 pb-5 pt-6">
                  <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-emerald-200/25 blur-3xl dark:bg-emerald-900/20" />
                  <div className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-cyan-100/30 blur-3xl dark:bg-cyan-900/10" />

                  <motion.div variants={fadeUp} className="relative">
                    <div className="mb-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                      <Sparkles size={10} />
                      Ooshas Prep Help
                    </div>
                    <h2 className="text-[25px] font-bold leading-[1.15] tracking-[-0.04em] text-slate-900 dark:text-white">
                      How can we<br />help you today?
                    </h2>
                    <p className="mt-2 max-w-[310px] text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                      Find quick answers about your exam preparation, courses, admissions and study abroad.
                    </p>
                  </motion.div>

                  {/* Search */}
                  <motion.div
                    variants={fadeUp}
                    className="
                      relative mt-5 flex items-center gap-2.5 rounded-[14px]
                      border border-slate-200/80 bg-white px-3.5
                      shadow-[0_8px_25px_-8px_rgba(15,23,42,0.08)]
                      transition focus-within:border-emerald-400
                      focus-within:ring-4 focus-within:ring-emerald-500/10
                      dark:border-slate-800 dark:bg-[#111827]
                    "
                  >
                    <Search size={16} className="shrink-0 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search help articles..."
                      className="h-11 min-w-0 flex-1 bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                    />
                    {search && (
                      <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-700">
                        <X size={14} />
                      </button>
                    )}
                  </motion.div>
                </div>

                {/* Topics */}
                {!search && (
                  <motion.div variants={fadeUp} className="px-5 pb-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Explore topics</h3>
                      <span className="text-[9px] text-slate-400">Quick help</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {topics.map((topic) => {
                        const Icon = topic.icon;
                        return (
                          <motion.button
                            key={topic.id}
                            variants={fadeUp}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            onClick={() => openTopic(topic)}
                            className="
                              group relative overflow-hidden rounded-[16px]
                              border border-slate-200/80 bg-white p-3 text-left
                              shadow-[0_3px_15px_-6px_rgba(15,23,42,0.06)]
                              transition hover:border-emerald-200
                              hover:shadow-[0_12px_30px_-12px_rgba(16,185,129,0.2)]
                              dark:border-slate-800 dark:bg-[#111827]
                              dark:hover:border-emerald-900
                            "
                          >
                            <div className="absolute -right-5 -top-5 h-14 w-14 rounded-full bg-emerald-50 opacity-0 blur-xl transition group-hover:opacity-100 dark:bg-emerald-900/20" />
                            <div className="relative mb-2.5 flex items-center justify-between">
                              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                                <Icon size={15} />
                              </div>
                              <ChevronRight size={13} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-500" />
                            </div>
                            <p className="relative text-[11px] font-bold text-slate-800 dark:text-slate-100">{topic.title}</p>
                            <p className="relative mt-1 line-clamp-2 text-[9px] leading-4 text-slate-400">{topic.description}</p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Articles */}
                <div className="border-t border-slate-200/70 px-5 py-5 dark:border-slate-800">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      {search ? "Search results" : "Popular articles"}
                    </h3>
                    {!search && (
                      <button onClick={() => setSearch("")} className="flex items-center gap-1 text-[9px] font-medium text-emerald-600">
                        View all <ArrowRight size={11} />
                      </button>
                    )}
                  </div>

                  <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
                    {filteredArticles.map((article) => (
                      <motion.button
                        key={article.id}
                        variants={fadeUp}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => openArticle(article)}
                        className="
                          group flex w-full items-center gap-3 rounded-[15px]
                          border border-slate-200/80 bg-white p-3 text-left
                          transition hover:border-emerald-200
                          hover:shadow-[0_6px_20px_-8px_rgba(15,23,42,0.08)]
                          dark:border-slate-800 dark:bg-[#111827]
                        "
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-slate-100 text-slate-500 dark:bg-slate-800">
                          <BookOpen size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-1.5">
                            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                              {article.category}
                            </span>
                            {article.featured && <span className="text-[8px] font-semibold text-slate-400">Featured</span>}
                          </div>
                          <p className="truncate text-[11px] font-bold text-slate-800 dark:text-slate-100">{article.title}</p>
                          <p className="mt-0.5 line-clamp-1 text-[9px] text-slate-400">{article.description}</p>
                          <div className="mt-1.5 flex items-center gap-1 text-[8px] text-slate-400">
                            <Clock3 size={9} />
                            {article.readTime}
                          </div>
                        </div>
                        <ChevronRight size={15} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-500" />
                      </motion.button>
                    ))}

                    {!filteredArticles.length && (
                      <div className="py-8 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30">
                          <Search size={20} />
                        </div>
                        <p className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-200">No article found</p>
                        <p className="mt-1 text-[10px] text-slate-400">Let Ooshas AI find the answer.</p>
                        <button
                          onClick={() => { setView("chat"); setMessage(search); }}
                          className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-semibold text-white dark:bg-white dark:text-slate-900"
                        >
                          Ask Ooshas AI
                        </button>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* AI CTA */}
                <div className="px-5 pb-5">
                  <motion.button
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView("chat")}
                    className="
                      relative flex w-full items-center gap-3 overflow-hidden
                      rounded-[17px] bg-slate-900 px-4 py-3.5 text-left text-white
                      shadow-[0_10px_30px_-8px_rgba(15,23,42,0.25)]
                      dark:bg-white dark:text-slate-900
                    "
                  >
                    <div className="absolute -right-5 -top-8 h-24 w-24 rounded-full bg-emerald-500/20 blur-2xl" />
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                      <Sparkles size={16} />
                    </div>
                    <div className="relative flex-1">
                      <p className="text-[11px] font-bold">Can't find your answer?</p>
                      <p className="mt-0.5 text-[9px] opacity-60">Ask Ooshas AI anything</p>
                    </div>
                    <ArrowRight size={16} className="relative" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* =================================================
                ARTICLE VIEW
            ================================================= */}

            {view === "article" && selectedArticle && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className="min-h-0 flex-1 overflow-y-auto bg-slate-50 dark:bg-[#080E1A]"
              >
                <div className="border-b border-slate-200 bg-white px-5 pb-5 pt-5 dark:border-slate-800 dark:bg-[#0B1120]">
                  <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                    <BookOpen size={11} />
                    {selectedArticle.category}
                  </div>
                  <h1 className="mt-2.5 text-[21px] font-bold leading-[1.2] tracking-[-0.03em] text-slate-900 dark:text-white">
                    {selectedArticle.title}
                  </h1>
                  <div className="mt-3 flex items-center gap-3 text-[9px] text-slate-400">
                    <span className="flex items-center gap-1"><Clock3 size={10} />{selectedArticle.readTime}</span>
                    <span>•</span>
                    <span>Ooshas Prep Help</span>
                  </div>
                </div>

                <div className="px-5 py-5">
                  <div className="whitespace-pre-line text-[11px] leading-[1.9] text-slate-600 dark:text-slate-300">
                    {selectedArticle.content}
                  </div>
                </div>

                <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0B1120]/95">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[17px] border border-emerald-100 bg-emerald-50/70 p-3.5 dark:border-emerald-950 dark:bg-emerald-950/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                        <Bot size={17} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-bold text-slate-900 dark:text-white">Still have questions?</p>
                        <p className="mt-0.5 text-[9px] leading-4 text-slate-500 dark:text-slate-400">
                          Let Ooshas AI explain this specifically for you.
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={startConversation}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                    >
                      <MessageCircle size={13} />
                      Ask Ooshas AI
                      <ArrowRight size={12} />
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* =================================================
                CHAT
            ================================================= */}

            {view === "chat" && (
              <div className="flex min-h-0 flex-1 flex-col bg-slate-50 dark:bg-[#080E1A]">
                {selectedArticle && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="shrink-0 border-b border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-[#0B1120]"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30">
                        <BookOpen size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Reading from</p>
                        <p className="truncate text-[10px] font-semibold text-slate-700 dark:text-slate-200">{selectedArticle.title}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex max-w-[88%] items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] ${
                            msg.role === "user"
                              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                          }`}
                        >
                          {msg.role === "user" ? <User size={12} /> : <Bot size={14} />}
                        </div>

                        <div
                          className={`rounded-[17px] px-3.5 py-2.5 text-[11px] leading-[1.65] ${
                            msg.role === "user"
                              ? "rounded-br-[5px] bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                              : "rounded-bl-[5px] border border-slate-200 bg-white text-slate-700 shadow-[0_3px_12px_-6px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-[#111827] dark:text-slate-200"
                          }`}
                        >
                          {msg.content}
                          {isStreaming && msg.id === messages[messages.length - 1]?.id && msg.role === "assistant" && (
                            <motion.span
                              animate={{ opacity: [1, 0, 1] }}
                              transition={{ duration: 0.8, repeat: Infinity }}
                              className="ml-1 inline-block h-3 w-0.5 rounded-full bg-emerald-500"
                            />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {isStreaming && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 px-9 text-[9px] text-slate-400"
                    >
                      <span className="flex gap-0.5">
                        {[0, 0.1, 0.2].map((delay) => (
                          <motion.span
                            key={delay}
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 0.7, repeat: Infinity, delay }}
                            className="h-1 w-1 rounded-full bg-emerald-500"
                          />
                        ))}
                      </span>
                      Ooshas AI is thinking
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {error && (
                  <div className="shrink-0 border-t border-red-100 bg-red-50 px-4 py-2 text-[9px] text-red-600">
                    {error}
                  </div>
                )}

                <div className="shrink-0 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#0B1120]">
                  <div className="flex items-end gap-2 rounded-[15px] border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-slate-800 dark:bg-[#111827]">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Ooshas AI..."
                      rows={1}
                      className="max-h-24 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-2 text-[11px] outline-none placeholder:text-slate-400 dark:text-white"
                    />
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={isStreaming ? stopGeneration : sendMessage}
                      disabled={!isStreaming && !message.trim()}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition disabled:cursor-not-allowed disabled:opacity-30 ${
                        isStreaming ? "bg-slate-900 dark:bg-white dark:text-slate-900" : "bg-emerald-500 hover:bg-emerald-600"
                      }`}
                    >
                      {isStreaming ? <StopCircle size={15} /> : <Send size={15} />}
                    </motion.button>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-1 text-[8px] text-slate-400">
                    <Sparkles size={8} />
                    Ooshas AI
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
          FLOATING LAUNCHER
      ===================================================== */}

      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsOpen(true)}
            className="
              fixed bottom-5 right-5 z-[9999] flex h-[58px] w-[58px]
              items-center justify-center rounded-full bg-slate-900 text-white
              shadow-[0_12px_40px_-10px_rgba(15,23,42,0.5)]
              dark:bg-white dark:text-slate-900 sm:right-7 sm:bottom-7
            "
          >
            <motion.span
              animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0, 0.35] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              className="absolute inset-0 rounded-[19px] bg-emerald-500"
            />
            <div className="relative flex items-center justify-center">
              <Bot size={25} />
            </div>
            <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}