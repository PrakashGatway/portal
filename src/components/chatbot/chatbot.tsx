"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  GraduationCap,
  HelpCircle,
  Loader2,
  MessageCircle,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  StopCircle,
  Ticket,
  User,
  UserRound,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import api from "../../axiosInstance";
import { toast } from "react-toastify";

const API_URL = "https://uat.gatewayabroadeducations.com";


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
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! 👋 I'm Ooshas AI. I can help you with admissions, test preparation, universities, courses and study abroad.",
    },
  ]);
  const [conversationId, setConversationId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("help");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");

  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [topics, setTopics] = useState([]);
  const [articles, setArticles] = useState([]);
  const dragConstraintsRef = useRef(null);

  const [buttonPosition, setButtonPosition] = useState({
    x: 0,
    y: 0,
  });

  const handleButtonDragEnd = (event, info) => {
    setButtonPosition((prev) => ({
      x: prev.x + info.offset.x,
      y: prev.y + info.offset.y,
    }));
  };

  /* =========================================================
     SCROLL
  ========================================================= */

  useEffect(() => {
    if (view !== "chat") return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, view]);

  /* =========================================================
     FETCH ARTICLES & TOPICS
  ========================================================= */
  const filterCategoryArticle = articles.filter((item) => {
    console.log(item.category);
    return item.category === selectedCategory;
  });

  const fetchArticlesAndTopics = async (data) => {
    try {
      setIsLoading(true);

      const query = {
        search: data,
      };

      const [topicsRes, articlesRes] = await Promise.all([
        axios.get("https://www.ooshasprep.com/api/article-category"),
        axios.get("https://www.ooshasprep.com/api/articles", {
          params: query,
        }),
      ]);

      const topicsData = topicsRes.data?.data || topicsRes.data || [];
      const articlesData = articlesRes.data?.data || articlesRes.data || [];

      const normalizedTopics = Array.isArray(topicsData)
        ? topicsData.map((topic, index) => ({
            id: topic.id || topic._id || `topic-${index}`,
            title: topic.title || topic.name || topic.category || "Untitled",
            name: topic.name || topic.title || topic.category || "Untitled",
            description:
              topic.description || topic.desc || "Explore this topic",
            icon: topic.icon || null,
            slug: topic.slug || topic.category || "",
          }))
        : [];

      const normalizedArticles = Array.isArray(articlesData)
        ? articlesData.map((article, index) => ({
            id: article.id || article._id || `article-${index}`,
            title: article.title || article.name || "Untitled Article",
            description:
              article.description ||
              article.excerpt ||
              article.summary ||
              "No description available",
            content:
              article.content ||
              article.body ||
              article.description ||
              "Content not available",
            category:
              article.category ||
              article.categoryName ||
              article.topic ||
              "General",
            readTime:
              article.readTime ||
              article.read_time ||
              article.readingTime ||
              "5 min read",
            featured: article.featured || article.isFeatured || false,
            slug: article.slug || "",
          }))
        : [];

      setTopics(normalizedTopics);
      setArticles(normalizedArticles);
    } catch (error) {
      console.error("Error fetching articles/topics:", error);
      setTopics(getFallbackTopics());
      setArticles(getFallbackArticles());
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackTopics = () => [
    {
      id: "1",
      title: "Test Preparation",
      name: "Test Preparation",
      description: "IELTS, TOEFL, GRE, GMAT & more",
      slug: "test-prep",
    },
    {
      id: "2",
      title: "Study Abroad",
      name: "Study Abroad",
      description: "Universities, visas & applications",
      slug: "study-abroad",
    },
    {
      id: "3",
      title: "Admissions",
      name: "Admissions",
      description: "Application process & requirements",
      slug: "admissions",
    },
    {
      id: "4",
      title: "Courses",
      name: "Courses",
      description: "Find the right program for you",
      slug: "courses",
    },
  ];

  const getFallbackArticles = () => [
    {
      id: "1",
      title: "How to Prepare for IELTS",
      description: "Complete guide to IELTS preparation",
      content: "IELTS preparation requires consistent practice...",
      category: "Test Preparation",
      readTime: "5 min read",
      featured: true,
    },
    {
      id: "2",
      title: "Study Abroad Checklist",
      description: "Everything you need before you fly",
      content: "Preparing to study abroad involves many steps...",
      category: "Study Abroad",
      readTime: "7 min read",
      featured: false,
    },
  ];

  useEffect(() => {
    fetchArticlesAndTopics(search);
  }, [search]);

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredArticles = articles.filter((article) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      (article.title || "").toLowerCase().includes(query) ||
      (article.description || "").toLowerCase().includes(query) ||
      (article.category || "").toLowerCase().includes(query)
    );
  });

  /* =========================================================
     ARTICLE / TOPIC
  ========================================================= */

  const openArticle = (article) => {
    setSelectedArticle(article);
    setView("article");
  };

  const openTopic = (topic) => {
    setSearch("");
    const topicTitle = (topic.title || topic.name || "").toLowerCase();
    const topicArticle = articles.find((article) => {
      const articleCategory = (article.category || "").toLowerCase();
      const firstWord = topicTitle.split(" ")[0];
      return (
        articleCategory.includes(firstWord) ||
        articleCategory.includes(topicTitle)
      );
    });

    if (topicArticle) {
      setSelectedArticle(topicArticle);
      setView("article");
      return;
    }
    setMessage(`Tell me about ${topic.title || topic.name}.`);
    setView("chat");
  };

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

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const assistantId = crypto.randomUUID();
    const assistantMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const token = localStorage.getItem("accessToken");

    try {
      const response = await fetch(`${API_URL}/api/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          question: text,
          conversationId,
          articleId: selectedArticle?.category || null,
          articleTitle: selectedArticle?.title || null,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error("Failed to connect to chatbot");
      if (!response.body) throw new Error("Streaming is not supported");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const processEvent = (event: string) => {
        const lines = event.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const rawData = line.replace("data:", "").trim();
          if (!rawData) continue;

          let data;
          try {
            data = JSON.parse(rawData);
          } catch {
            continue;
          }

          if (data.type === "conversation")
            setConversationId(data.conversationId);

          // The API may return the answer as { result: { answer } } instead
          // of emitting token events.
          const answer = data.result?.answer;
          if (typeof answer === "string") {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: msg.content + answer }
                  : msg,
              ),
            );
            setIsStreaming(false);
          }

          if (data.type === "token") {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: msg.content + data.content }
                  : msg,
              ),
            );
          }
          if (data.type === "complete") setIsStreaming(false);
          if (data.type === "error") {
            setError(data.message || "Something went wrong.");
            setIsStreaming(false);
          }
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          if (buffer.trim()) processEvent(buffer);
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) processEvent(event);
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

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  const newConversation = () => {
    stopGeneration();
    setConversationId(null);
    setSelectedArticle(null);
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Hi! 👋 I'm Ooshas AI. How can I help you today?",
      },
    ]);
    setView("chat");
    setError("");
  };

  const closeChat = () => {
    stopGeneration();
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "General",
    priority: "Medium",
    description: "",
  });

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.85,
              y: 30,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.08,
              x: 35,
              y: 35,
            }}
            transition={{
              duration: 0.35,
              ease: [0.4, 0, 1, 1],
            }}
            style={{
              transformOrigin: "bottom right",
            }}
            className="fixed bottom-4 right-4 z-[9999] flex h-[min(680px,calc(100vh-8rem))] w-[calc(100vw-24px)] max-w-[390px] flex-col overflow-hidden rounded-[26px] bg-gradient-to-b from-[#d94f2f] via-[#f36d45] via-[30%] to-gray-100 to-[55%] shadow-[12px_3px_90px_-20px_rgba(23,46,58,1)] sm:right-6 sm:bottom-22"
          >
            {/* HEADER (hidden on the help home, since the hero below carries its own header) */}
            {view !== "help" && (
              <div className="relative z-10 shrink-0 border-b border-[#eadfd9] bg-white px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setView("help");
                        setSelectedArticle(null);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8791a3] hover:bg-[#fff5f0] hover:text-[#ff6040]"
                    >
                      <ArrowLeft size={18} />
                    </motion.button>

                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff704f] text-white shadow-lg shadow-[#ff704f]/30">
                        {/* <Bot size={20} /> */}
                        <img src="/gif/1.gif" alt="gif" />
                      </div>
                      <motion.span
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#16a77a]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold tracking-tight text-[#17243a]">
                          {view === "ticket"
                            ? "Create New Ticket"
                            : "Ooshas AI"}
                        </h3>
                        {view !== "ticket" && (
                          <span className="rounded-full bg-[#ffd8c9] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#ff6040]">
                            AI
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[#8791a3]">
                        {view === "ticket"
                          ? "We'll get back to you as soon as possible"
                          : "Your 24/7 study assistant"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {view === "chat" && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={newConversation}
                        title="New chat"
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8791a3] hover:bg-[#fff5f0] hover:text-[#ff6040]"
                      >
                        <RotateCcw size={16} />
                      </motion.button>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={closeChat}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8791a3] hover:bg-[#fff5f0] hover:text-[#ff6040]"
                    >
                      <X size={19} />
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

            {/* HELP HOME */}
            {view === "help" && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={stagger}
                className="scrollbar-hide min-h-0 flex-1 overflow-y-auto bg-transparent"
              >
                {/* Hero */}
                <div className="relative overflow-hidden  px-5 pb-16 pt-5">
                  <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#ff704f]/20 blur-3xl" />

                  {/* Top row: brand + close, replaces the generic header on this screen */}
                  <motion.div
                    variants={fadeUp}
                    className="relative z-10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
                        {/* <Bot size={18} /> */}
                        <img src="/gif/1.gif" alt="gif" />
                      </div>
                      <span className="text-sm font-bold tracking-tight text-white">
                        Ooshas AI
                      </span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={closeChat}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      <X size={19} />
                    </motion.button>
                  </motion.div>

                  <motion.div variants={fadeUp} className="relative z-10 mt-4">
                    <h2 className="text-[30px] font-bold leading-[1.15] tracking-tight text-white">
                      Hello there!
                      <br />
                      How can we help?
                    </h2>
                    <p className="mt-2.5 max-w-[300px] text-sm leading-6 text-white">
                      Ask about exam prep, courses, admissions or study abroad —
                      we're here for it.
                    </p>
                  </motion.div>
                </div>

                {/* Overlapping card stack: recent message, status, search */}
                <motion.div
                  variants={fadeUp}
                  className="relative z-10 -mt-9 px-4"
                >
                  <div className="space-y-3">
                    <motion.button
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setView("chat")}
                      className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-[0_16px_40px_-16px_rgba(23,36,58,0.25)] transition hover:shadow-[0_16px_40px_-12px_rgba(255,112,79,0.25)]"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff5f0] text-[#ff6040]">
                        {/* <Bot size={20} /> */}
                        <img src="/gif/1.gif" alt="gif" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-[#17243a]">
                            Recent message
                          </p>
                          <span className="shrink-0 text-xs text-[#8791a3]">
                            Just now
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-[#8791a3]">
                          Hi! I can help with admissions, test prep and more.
                        </p>
                      </div>
                      <ChevronRight
                        size={18}
                        className="shrink-0 text-[#8791a3]"
                      />
                    </motion.button>

                    {/* <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_16px_40px_-16px_rgba(23,36,58,0.2)]">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#16a77a]/10 text-[#16a77a]">
                        <CheckCircle2 size={22} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#17243a]">All systems operational</p>
                        <p className="mt-0.5 text-xs text-[#8791a3]">Ooshas AI is online and ready to help</p>
                      </div>
                    </div> */}

                    <div className="flex items-center gap-3 rounded-2xl border border-[#eadfd9] bg-white px-4 shadow-[0_16px_40px_-16px_rgba(23,36,58,0.12)] transition focus-within:border-[#ff704f] focus-within:ring-4 focus-within:ring-[#ff704f]/10">
                      <Search size={18} className="shrink-0 text-[#8791a3]" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search for help"
                        className="h-13 min-w-0 flex-1 bg-transparent py-3.5 text-sm text-[#17243a] outline-none placeholder:text-[#8791a3]"
                      />
                      {search && (
                        <button
                          onClick={() => setSearch("")}
                          className="text-[#8791a3] hover:text-[#ff6040]"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Articles */}
                <div className="px-4 py-5">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <h3 className="text-sm font-bold text-[#17243a]">
                      {search ? "Search results" : "Popular articles"}
                    </h3>
                    {!search && (
                      <button
                        onClick={() => setSearch(" ")}
                        className="flex items-center gap-1 text-xs font-semibold text-[#ff6040]"
                      >
                        View all <ArrowRight size={13} />
                      </button>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-20 animate-pulse rounded-2xl bg-[#eadfd9]/60"
                        />
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      variants={stagger}
                      initial="hidden"
                      animate="visible"
                      className="space-y-2"
                    >
                      {filteredArticles.map((article, idx) => (
                        <motion.button
                          key={article.id || idx}
                          variants={fadeUp}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => openArticle(article)}
                          className="group flex w-full items-center gap-3 rounded-2xl hover:outline bg-white p-3.5 text-left transition hover:outline-[#ff9a82] hover:shadow-[0_10px_25px_-10px_rgba(23,36,58,0.15)]"
                        >
                          {/* <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#fff5f0] text-[#ff6040]">
                            <BookOpen size={19} />
                          </div> */}
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-1.5">
                              {/* <span className="rounded-full bg-[#fff0bd] px-2 py-0.5 text-[10px] font-bold text-[#ff6040]">
                                {article.category}
                              </span> */}
                              {article.featured && (
                                <span className="text-[10px] font-semibold text-[#8791a3]">
                                  Featured
                                </span>
                              )}
                            </div>
                            <p className="truncate text-sm font-semibold text-[#17243a]">
                              {article.title}
                            </p>
                            <p
                              className="mt-0.5 line-clamp-1 text-xs text-[#8791a3]"
                              dangerouslySetInnerHTML={{
                                __html: article.description ?? "",
                              }}
                            />
                            {/* <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#8791a3]">
                              <Clock3 size={11} />
                              {article.readTime}
                            </div> */}
                          </div>
                          <ChevronRight
                            size={17}
                            className="shrink-0 text-[#8791a3] transition group-hover:translate-x-0.5 group-hover:text-[#ff6040]"
                          />
                        </motion.button>
                      ))}

                      {!filteredArticles.length && (
                        <div className="py-10 text-center">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff5f0] text-[#ff6040]">
                            <Search size={22} />
                          </div>
                          <p className="mt-3 text-sm font-bold text-[#17243a]">
                            No article found
                          </p>
                          <p className="mt-1 text-xs text-[#8791a3]">
                            Let Ooshas AI find the answer.
                          </p>
                          <button
                            onClick={() => {
                              setView("chat");
                              setMessage(search);
                            }}
                            className="mt-4 rounded-xl bg-[#17243a] px-4 py-2.5 text-xs font-bold text-white"
                          >
                            Ask Ooshas AI
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {!search && (
                  <motion.div variants={fadeUp} className="px-4 pb-2 pt-6">
                    <div className="mb-3 flex items-center justify-between px-1">
                      <h3 className="text-sm font-bold text-[#17243a]">
                        Explore topics
                      </h3>
                    </div>

                    {isLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-16 animate-pulse rounded-2xl bg-[#eadfd9]/60"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className=" grid grid-cols-2 gap-2">
                        {topics.map((topic, key) => {
                          const Icon = topic.icon || GraduationCap;

                          return (
                            <motion.button
                              key={topic.id || key}
                              variants={fadeUp}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => {
                                openTopic(topic);
                                setSelectedCategory(topic.slug);
                                setView("category");
                              }}
                              className="group flex w-full items-center gap-1 rounded-2xl hover:outline  bg-white p-3 text-left transition hover:outline-[#ff9a82] hover:shadow-[0_10px_25px_-10px_rgba(255,112,79,0.2)]"
                            >
                              {/* <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#fff5f0] text-[#ff6040]">
                                <Icon size={18} />
                              </div> */}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-[#17243a]">
                                  {topic.name}
                                </p>
                                {/* <p
                                  className="mt-0.5 line-clamp-1 text-xs text-[#8791a3]"
                                  dangerouslySetInnerHTML={{
                                    __html: topic.description,
                                  }}
                                /> */}
                              </div>
                              {/* <ChevronRight
                                size={17}
                                className="shrink-0 text-[#8791a3] transition group-hover:translate-x-0.5 group-hover:text-[#ff6040]"
                              /> */}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* AI CTA */}
                <div className="px-4 pb-5 space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView("ticket")}
                    className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-[#17243a] px-4 py-4 text-left text-white shadow-[0_10px_30px_-8px_rgba(23,36,58,0.25)]"
                  >
                    {/* <div className="absolute -right-5 -top-8 h-24 w-24 rounded-full bg-[#ff704f]/30 blur-2xl" /> */}
                    <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#ff704f] text-white">
                      <Ticket size={18} />
                    </div>
                    <div className="relative flex-1">
                      <p className="text-sm font-bold">Raise Ticket</p>
                    </div>
                    <ArrowRight size={18} className="relative" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ARTICLE VIEW */}
            {view === "article" && selectedArticle ? (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className="scrollbar-hide min-h-0 h-full w-full flex-1 overflow-y-auto bg-[#fffaf6]"
              >
                <div className=" bg-white px-5  pt-5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ff6040]">
                    <BookOpen size={13} />
                    {selectedArticle.category}
                  </div>
                  <div className="text-[#ff6040] mt-3 font-medium">
                    {selectedArticle?.title}
                  </div>
                </div>

                <div className="px-5 py-5">
                  <div
                    className="whitespace-pre-line text-sm leading-[1.9] text-[#26344b]"
                    dangerouslySetInnerHTML={{
                      __html: selectedArticle.content,
                    }}
                  />
                </div>

                <div className="sticky bottom-0 border-t border-[#eadfd9] bg-white/95 p-4 backdrop-blur-xl">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-[#ffd8c9] bg-[#fff5f0] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff704f] text-white">
                        {/* <Bot size={18} /> */}
                        <img src="/gif/1.gif" alt="gif" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#17243a]">
                          Still have questions?
                        </p>
                        <p className="mt-0.5 text-xs leading-5 text-[#8791a3]">
                          Let Ooshas AI explain this specifically for you.
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={startConversation}
                      className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#17243a] px-3 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#26344b]"
                    >
                      <MessageCircle size={15} />
                      Ask Ooshas AI
                      <ArrowRight size={14} />
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            ) : null}

            {view === "category" && selectedCategory ? (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white"
              >
                {/* Header */}
                <div className="shrink-0 bg-white px-5 pb-5 pt-5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ff6040]">
                    <BookOpen size={13} />
                    {selectedCategory}
                  </div>
                </div>

                {/* Articles - only this section scrolls */}
                <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide px-5">
                  <div className="mx-auto w-full max-w-3xl space-y-2 pb-4">
                    {filterCategoryArticle.map((article: any) => (
                      <button
                        key={article._id}
                        onClick={() => openArticle(article)}
                        className="group w-full rounded-xl border border-[#f36d45]/30 bg-gradient-to-r from-[#fff3ee] to-[#fff8f5] px-3.5 py-3 text-left transition-all duration-200 hover:border-[#f36d45]/50 hover:shadow-[0_6px_20px_-8px_rgba(243,109,69,0.3)] active:scale-[0.99]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="min-w-0 flex-1 truncate text-sm font-semibold text-[#d94f2f]">
                            {article.title}
                          </h4>

                          <span className="shrink-0 text-[10px] font-medium text-[#8791a3]">
                            {article.views || 0} views
                          </span>

                          <ChevronRight
                            size={16}
                            className="shrink-0 translate-x-0.5 text-[#f36d45]"
                          />
                        </div>

                        <p
                          className="mt-1 line-clamp-1 text-xs text-[#8791a3]"
                          dangerouslySetInnerHTML={{
                            __html: article.description,
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fixed bottom footer */}
                <div className="shrink-0 bg-white px-5 py-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-[#ffd8c9] bg-[#fff5f0] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff704f] text-white">
                        <img src="/gif/1.gif" alt="gif" />
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#17243a]">
                          Still have questions?
                        </p>

                        <p className="mt-0.5 text-xs leading-5 text-[#8791a3]">
                          Let Ooshas AI explain this specifically for you.
                        </p>
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={startConversation}
                      className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#17243a] px-3 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#26344b]"
                    >
                      <MessageCircle size={15} />
                      Ask Ooshas AI
                      <ArrowRight size={14} />
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            ) : null}

            {/* CHAT */}
            {view === "chat" && (
              <div className="flex min-h-0 flex-1 flex-col bg-[#fffaf6]">
                {selectedArticle && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="shrink-0 border-b border-[#eadfd9] bg-white px-4 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8791a3]">
                          Reading from
                        </p>
                        <p className="truncate text-xs font-semibold text-[#26344b]">
                          {selectedArticle.title}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto  px-4 py-3">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex max-w-[88%] items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            msg.role === "user"
                              ? "bg-[#17243a] text-white"
                              : "bg-[#fff5f0] text-[#ff6040]"
                          }`}
                        >
                          {msg.role === "user" ? (
                            <UserRound size={16} />
                          ) : (
                            <img src="/gif/1.gif" alt="gif" />
                          )}
                        </div>

                        <div
                          className={`rounded-[18px] px-4 py-3 text-[13px] leading-[1.65] ${
                            msg.role === "user"
                              ? "rounded-br-[5px] bg-[#17243a] text-white"
                              : "rounded-bl-[5px] border border-[#eadfd9] bg-white text-[#26344b] shadow-[0_3px_12px_-6px_rgba(23,36,58,0.06)]"
                          }`}
                        >
                          <div
                            dangerouslySetInnerHTML={{ __html: msg.content }}
                          />
                          {isStreaming &&
                            msg.id === messages[messages.length - 1]?.id &&
                            msg.role === "assistant" && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-2 text-xs text-[#8791a3]"
                              >
                                <span className="flex gap-0.5">
                                  {[0, 0.1, 0.2].map((delay) => (
                                    <motion.span
                                      key={delay}
                                      animate={{ y: [0, -3, 0] }}
                                      transition={{
                                        duration: 0.7,
                                        repeat: Infinity,
                                        delay,
                                      }}
                                      className="h-1 w-1 rounded-full bg-[#ff704f]"
                                    />
                                  ))}
                                </span>
                              </motion.div>
                            )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* {isStreaming && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 px-10 text-xs text-[#8791a3]"
                    >
                      <span className="flex gap-0.5">
                        {[0, 0.1, 0.2].map((delay) => (
                          <motion.span
                            key={delay}
                            animate={{ y: [0, -3, 0] }}
                            transition={{
                              duration: 0.7,
                              repeat: Infinity,
                              delay,
                            }}
                            className="h-1 w-1 rounded-full bg-[#ff704f]"
                          />
                        ))}
                      </span>
                    </motion.div>
                  )} */}

                  <div ref={messagesEndRef} />
                </div>

                {error && (
                  <div className="shrink-0 border-t border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-600">
                    {error}
                  </div>
                )}

                <div className="shrink-0 border-t border-[#eadfd9] bg-white p-2">
                  <div className="flex items-end gap-2 rounded-full border border-[#eadfd9] bg-[#fffaf6] p-1 transition focus-within:border-[#ff704f] focus-within:ring-4 focus-within:ring-[#ff704f]/10">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Ooshas AI..."
                      rows={1}
                      className="py-2.5 flex-1 resize-none bg-transparent px-2.5 text-sm text-[#17243a] outline-none placeholder:text-[#8791a3]"
                    />
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={isStreaming ? stopGeneration : sendMessage}
                      disabled={!isStreaming && !message.trim()}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition disabled:cursor-not-allowed disabled:opacity-30 ${
                        isStreaming
                          ? "bg-[#17243a]"
                          : "bg-[#ff704f] hover:bg-[#ff6040]"
                      }`}
                    >
                      {isStreaming ? (
                        <StopCircle size={17} />
                      ) : (
                        <Send size={17} />
                      )}
                    </motion.button>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-[#8791a3]">
                    Ooshas AI
                  </div>
                </div>
              </div>
            )}

            {/* CREATE NEW TICKET */}
            {view === "ticket" && (
              <div className="flex min-h-0 flex-1 flex-col bg-white">
                {/* Form */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();

                    if (
                      !ticketForm.subject.trim() ||
                      !ticketForm.category ||
                      !ticketForm.priority ||
                      !ticketForm.description.trim()
                    ) {
                      setError("Please fill in all required fields.");
                      return;
                    }

                    try {
                      setError("");

                      // Add your ticket creation API here
                      // await createSupportTicket(ticketForm);

                      // console.log
                      const res = await api.post("/support", ticketForm);
                      toast.success("Support ticket created successfully!");

                      console.log("Ticket Data:", res?.data);

                      setTicketForm({
                        subject: "",
                        category: "general",
                        priority: "medium",
                        description: "",
                      });

                      closeChat();
                    } catch (err) {
                      setError("Unable to create ticket. Please try again.");
                    }
                  }}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
                    {/* Subject */}
                    <div>
                      <label className="text-[12px] font-semibold uppercase tracking-wider mb-1 px-2">
                        Subject <span className="text-[#ff6040]">*</span>
                      </label>

                      <input
                        type="text"
                        value={ticketForm.subject}
                        onChange={(e) =>
                          setTicketForm((prev) => ({
                            ...prev,
                            subject: e.target.value,
                          }))
                        }
                        placeholder="Brief summary of your issue"
                        className="h-[45px] w-full rounded-[10px] border border-[#dedede] bg-[#fafafa] px-5 text-[14px] text-[#17243a] outline-none transition placeholder:text-[#8791a3] focus:border-[#ff704f] focus:ring-2 focus:ring-[#ff704f]/10"
                      />
                    </div>

                    {/* Category and Priority */}
                    <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                      {/* Category */}
                      <div>
                        <label className="text-[12px] font-semibold uppercase tracking-wider mb-1 px-2">
                          Category <span className="text-[#ff6040]">*</span>
                        </label>

                        <select
                          value={ticketForm.category}
                          onChange={(e) =>
                            setTicketForm((prev) => ({
                              ...prev,
                              category: e.target.value,
                            }))
                          }
                          className="h-[45px] w-full rounded-[10px] border border-[#dedede] bg-[#fafafa] px-5 text-[14px] text-[#17243a] outline-none transition placeholder:text-[#8791a3] focus:border-[#ff704f] focus:ring-2 focus:ring-[#ff704f]/10"
                        >
                          <option value="general">General</option>
                          <option value="technical">Technical</option>
                          <option value="payment">Payment</option>
                          <option value="course">Course</option>
                          <option value="account">Account</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="text-[12px] font-semibold uppercase tracking-wider mb-1 px-2">
                          Priority <span className="text-[#ff6040]">*</span>
                        </label>

                        <select
                          value={ticketForm.priority}
                          onChange={(e) =>
                            setTicketForm((prev) => ({
                              ...prev,
                              priority: e.target.value,
                            }))
                          }
                          className="h-[45px] w-full rounded-[10px] border border-[#dedede] bg-[#fafafa] px-5 text-[14px] text-[#17243a] outline-none transition placeholder:text-[#8791a3] focus:border-[#ff704f] focus:ring-2 focus:ring-[#ff704f]/10"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mt-4">
                      <label className="text-[12px] font-semibold uppercase tracking-wider mb-1 px-2">
                        Description <span className="text-[#ff6040]">*</span>
                      </label>

                      <textarea
                        value={ticketForm.description}
                        onChange={(e) =>
                          setTicketForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Please provide as much detail as possible..."
                        rows={5}
                        className="min-h-[3rem] w-full resize-none rounded-[10px] border border-[#dedede] bg-[#fafafa] px-5 py-4 text-[14px] leading-relaxed text-[#17243a] outline-none transition placeholder:text-[#8791a3] focus:border-[#ff704f] focus:ring-2 focus:ring-[#ff704f]/10"
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="shrink-0 border-t border-[#eeeeee] bg-white px-7 py-5">
                    <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                      <motion.button
                        whileHover={{ scale: 1.01, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        // onClick={() => setView("ticket")}
                        type="submit"
                        className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-[#17243a] px-4 py-4 text-left text-white shadow-[0_10px_30px_-8px_rgba(23,36,58,0.25)]"
                      >
                        <div className="relative flex-1">
                          <p className="text-sm font-bold">Create Ticket</p>
                        </div>
                        <div className="absolute -right-5 -top-8 h-24 w-24 rounded-full bg-[#ff704f]/30 blur-2xl" />
                        <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#ff704f] text-white">
                          <Send size={18} />
                        </div>
                        {/* <ArrowRight size={18} className="relative" /> */}
                      </motion.button>

                      {/* <button
            type="submit"
            className="flex h-[56px] items-center justify-center gap-3 rounded-[15px] bg-[#ff6815] px-9 text-[17px] font-medium text-white shadow-sm transition hover:bg-[#f45d0b]"
          >
            <Send size={20} strokeWidth={1.8} />
            Create Ticket
          </button> */}
                    </div>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 z-[9999] pointer-events-none">
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.button
              key="open-button"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: buttonPosition.x,
                y: buttonPosition.y,
              }}
              exit={{ opacity: 0, scale: 0.6 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              whileDrag={{ scale: 1.08 }}
              drag
              dragMomentum={false}
              dragElastic={0.05}
              onDragEnd={handleButtonDragEnd}
              onClick={() => setIsOpen(true)}
              className="pointer-events-auto fixed bottom-2 right-5 flex h-[58px] w-[58px] cursor-grab items-center justify-center sm:bottom-7 sm:right-7"
            >
              <motion.span
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="absolute inset-[-8px] -z-10 "
              />

              <motion.span
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.5,
                }}
                className="absolute inset-[-3px] -z-10 rounded-full bg-[#ff704f]"
              />

              <span className="relative z-10 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#17243a] text-white shadow-[0_12px_40px_-10px_rgba(23,36,58,0.5)]">
                <img
                  src="/gif/1.gif"
                  alt="gif"
                  className="h-full w-full rounded-full object-cover"
                />
              </span>

              <span className="absolute right-0 top-0 z-20 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#16a77a]" />
            </motion.button>
          ) : (
            <motion.button
              key="close-button"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: buttonPosition.x,
                y: buttonPosition.y,
              }}
              exit={{ opacity: 0, scale: 0.7 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              whileDrag={{ scale: 1.08 }}
              drag
              dragMomentum={false}
              dragElastic={0.05}
              onDragEnd={handleButtonDragEnd}
              onClick={closeChat}
              className="pointer-events-auto fixed bottom-2 right-5 flex h-12 w-12 cursor-grab items-center justify-center rounded-full bg-[#f36d45] text-white shadow-lg sm:right-7"
            >
              <ArrowDown size={20} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
