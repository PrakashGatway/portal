import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Download,
  FileText,
  Headphones,
  Info,
  Loader2,
  Mic,
  PenTool,
  RefreshCw,
  Target,
  TrendingUp,
  XCircle,
  BookOpen,
} from "lucide-react";
import api from "../../axiosInstance";
import "./IeltsResult.css";

const SECTION_META = {
  reading: { label: "Reading", icon: BookOpen },
  listening: { label: "Listening", icon: Headphones },
  writing: { label: "Writing", icon: PenTool },
  speaking: { label: "Speaking", icon: Mic },
};

const SECTION_ORDER = ["reading", "listening", "writing", "speaking"];

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const idOf = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatDuration = (seconds) => {
  const total = Math.max(0, Math.round(safeNumber(seconds)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

const formatBand = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return Number.isInteger(number) ? String(number) : number.toFixed(1);
};

const formatPercentage = (value) => `${Math.round(safeNumber(value))}%`;

const humanize = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const isAnswered = (answer) => {
  if (Array.isArray(answer)) return answer.length > 0;
  if (answer && typeof answer === "object") {
    return Object.values(answer).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined && value !== "";
    });
  }
  return answer !== null && answer !== undefined && answer !== "";
};

const answerText = (answer) => {
  if (answer === null || answer === undefined || answer === "") return "Not answered";
  if (Array.isArray(answer)) return answer.join(", ");
  if (typeof answer === "object") {
    return Object.entries(answer)
      .map(([key, value]) => `${humanize(key)}: ${Array.isArray(value) ? value.join(", ") : value}`)
      .join(" • ");
  }
  return String(answer);
};

const getQuestionCorrectAnswer = (question) => {
  if (!question) return null;
  if (question.correctChoiceLabel !== null && question.correctChoiceLabel !== undefined) {
    return question.correctChoiceLabel;
  }
  if (question.correctAnswer !== null && question.correctAnswer !== undefined) {
    return question.correctAnswer;
  }
  if (Array.isArray(question.choices)) {
    const correct = question.choices.filter((choice) => choice.isCorrect).map((choice) => choice.label);
    if (correct.length) return correct;
  }
  return null;
};

const getQuestionChoices = (question) => {
  if (!Array.isArray(question?.choices)) return [];
  return question.choices.map((choice) => ({
    label: choice.label,
    text: choice.text,
    isCorrect: Boolean(choice.isCorrect),
  }));
};

const normalizeResult = (payload) => {
  const data = payload?.data || payload || {};
  return {
    ...data,
    score: data.score || {},
    analysis: data.analysis || {},
    sections: Array.isArray(data.sections) ? data.sections : [],
  };
};

const ScoreRing = ({ score, label, size = 180 }) => {
  const numeric = safeNumber(score, 0);
  const percentage = Math.max(0, Math.min(100, numeric * 10));
  const display = score === null || score === undefined ? "—" : formatBand(score);

  return (
    <div
      className="ielts-result-score-ring"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--ielts-primary) ${percentage}%, var(--ielts-ring-bg) ${percentage}% 100%)`,
      }}
    >
      <div className="ielts-result-score-ring-inner">
        <strong>{display}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, helper, className = "" }) => (
  <div className={`ielts-result-stat-card ${className}`}>
    <div className="ielts-result-stat-icon">
      <Icon size={19} />
    </div>
    <div className="ielts-result-stat-content">
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </div>
  </div>
);

const SectionScoreCard = ({ section, index, onOpen }) => {
  const meta = SECTION_META[section.section] || SECTION_META.reading;
  const Icon = meta.icon;
  const analysis = section.analysis || {};
  const score = section.score ?? analysis.bandScore;
  const attempted = safeNumber(analysis.attemptedQuestions);
  const total = safeNumber(analysis.totalQuestions);
  const accuracy = safeNumber(analysis.accuracy);
  const correct = safeNumber(analysis.correctAnswers);
  const incorrect = safeNumber(analysis.incorrectAnswers);
  const skipped = safeNumber(analysis.skippedQuestions);

  return (
    <button type="button" className="ielts-result-section-card" onClick={() => onOpen(index)}>
      <div className="ielts-result-section-card-head">
        <div className={`ielts-result-section-icon ielts-result-section-${section.section}`}>
          <Icon size={21} />
        </div>
        <div className="ielts-result-section-title">
          <span>Section {index + 1}</span>
          <h3>{meta.label}</h3>
        </div>
        <div className="ielts-result-section-band">
          <strong>{formatBand(score)}</strong>
          <span>Band</span>
        </div>
      </div>

      <div className="ielts-result-progress-track">
        <div className="ielts-result-progress-fill" style={{ width: `${Math.max(0, Math.min(100, accuracy))}%` }} />
      </div>

      <div className="ielts-result-section-stats">
        <span><CheckCircle2 size={15} /> {correct} correct</span>
        <span><XCircle size={15} /> {incorrect} wrong</span>
        <span><Info size={15} /> {skipped} skipped</span>
        <span>{attempted}/{total} attempted</span>
      </div>

      <div className="ielts-result-section-footer">
        <span>{formatDuration(analysis.timeSpent)}</span>
        <span>View details →</span>
      </div>
    </button>
  );
};

const QuestionReview = ({ question, number }) => {
  const [open, setOpen] = useState(false);
  const questionData = question.question && typeof question.question === "object" ? question.question : question;
  const correctAnswer = question.correctAnswer ?? getQuestionCorrectAnswer(questionData);
  const choices = getQuestionChoices(questionData);
  const answered = isAnswered(question.answer);
  const correct = question.isCorrect === true;

  return (
    <div className={`ielts-result-question ${correct ? "is-correct" : answered ? "is-incorrect" : "is-skipped"}`}>
      <button type="button" className="ielts-result-question-head" onClick={() => setOpen((value) => !value)}>
        <div className="ielts-result-question-number">{number}</div>
        <div className="ielts-result-question-summary">
          <div className="ielts-result-question-topline">
            <strong>{humanize(questionData?.questionType || "Question")}</strong>
            <span>{safeNumber(question.obtainedMarks)} mark{safeNumber(question.obtainedMarks) === 1 ? "" : "s"}</span>
          </div>
          <div className="ielts-result-question-status">
            {correct ? <CheckCircle2 size={15} /> : answered ? <XCircle size={15} /> : <Info size={15} />}
            <span>{correct ? "Correct" : answered ? "Incorrect" : "Not answered"}</span>
          </div>
        </div>
        {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {open ? (
        <div className="ielts-result-question-body">
          {questionData?.content ? (
            <div className="ielts-result-question-content" dangerouslySetInnerHTML={{ __html: questionData.content }} />
          ) : null}

          {questionData?.instructions ? (
            <div className="ielts-result-question-instructions">
              <strong>Instructions</strong>
              <div dangerouslySetInnerHTML={{ __html: questionData.instructions }} />
            </div>
          ) : null}

          {choices.length > 0 ? (
            <div className="ielts-result-options">
              {choices.map((choice) => {
                const selected = Array.isArray(question.answer)
                  ? question.answer.map(String).includes(String(choice.label))
                  : String(question.answer ?? "") === String(choice.label);
                return (
                  <div
                    key={`${idOf(questionData?._id)}-${choice.label}`}
                    className={`ielts-result-option ${choice.isCorrect ? "correct-option" : ""} ${selected ? "selected-option" : ""}`}
                  >
                    <span className="ielts-result-option-label">{choice.label}</span>
                    <span>{choice.text || choice.label}</span>
                    <div className="ielts-result-option-tags">
                      {selected ? <small>Your answer</small> : null}
                      {choice.isCorrect ? <small>Correct answer</small> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="ielts-result-answer-grid">
            <div>
              <span>Your answer</span>
              <strong>{answerText(question.answer)}</strong>
            </div>
            <div>
              <span>Correct answer</span>
              <strong>{answerText(correctAnswer)}</strong>
            </div>
            <div>
              <span>Time spent</span>
              <strong>{formatDuration(question.timeSpent)}</strong>
            </div>
            <div>
              <span>Flagged</span>
              <strong>{question.flagged ? "Yes" : "No"}</strong>
            </div>
          </div>

          {question.evaluation?.feedback ? (
            <div className="ielts-result-feedback">
              <strong>Evaluation feedback</strong>
              <p>{question.evaluation.feedback}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const SectionDetail = ({ section }) => {
  const meta = SECTION_META[section.section] || SECTION_META.reading;
  const Icon = meta.icon;
  const analysis = section.analysis || {};
  const groups = Array.isArray(section.groups) ? section.groups : [];
  const flattenedQuestions = groups.flatMap((group) =>
    (group.questionSets || []).flatMap((set) =>
      (set.questions || []).map((question) => ({
        ...question,
        groupTitle: group.title,
        questionSetTitle: set.title,
      })),
    ),
  );

  return (
    <div className="ielts-result-detail-panel">
      <div className="ielts-result-detail-heading">
        <div className={`ielts-result-section-icon ielts-result-section-${section.section}`}>
          <Icon size={20} />
        </div>
        <div>
          <span>Detailed review</span>
          <h3>{meta.label}</h3>
        </div>
        <div className="ielts-result-detail-band">Band {formatBand(section.score ?? analysis.bandScore)}</div>
      </div>

      <div className="ielts-result-detail-stats">
        <StatCard icon={Target} label="Accuracy" value={formatPercentage(analysis.accuracy)} />
        <StatCard icon={CheckCircle2} label="Correct" value={analysis.correctAnswers ?? 0} />
        <StatCard icon={XCircle} label="Incorrect" value={analysis.incorrectAnswers ?? 0} />
        <StatCard icon={Clock3} label="Time spent" value={formatDuration(analysis.timeSpent)} />
      </div>

      {analysis.feedback ? (
        <div className="ielts-result-evaluation-box">
          <strong>Section feedback</strong>
          <p>{analysis.feedback}</p>
          {Array.isArray(analysis.strengths) && analysis.strengths.length > 0 ? (
            <div>
              <span>Strengths</span>
              <ul>{analysis.strengths.map((item, index) => <li key={index}>{item}</li>)}</ul>
            </div>
          ) : null}
          {Array.isArray(analysis.weaknesses) && analysis.weaknesses.length > 0 ? (
            <div>
              <span>Areas to improve</span>
              <ul>{analysis.weaknesses.map((item, index) => <li key={index}>{item}</li>)}</ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {flattenedQuestions.length > 0 ? (
        <div className="ielts-result-question-list">
          <div className="ielts-result-subheading">
            <div>
              <span>Question review</span>
              <h4>{flattenedQuestions.length} questions</h4>
            </div>
            <small>Click a question to view your answer and the correct answer.</small>
          </div>
          {flattenedQuestions.map((question, index) => (
            <QuestionReview key={idOf(question._id) || `${section.section}-${index}`} question={question} number={index + 1} />
          ))}
        </div>
      ) : (
        <div className="ielts-result-empty-detail">
          <FileText size={28} />
          <strong>Question-level review is not available</strong>
          <p>The server returned section-level analysis, but not individual question details for this attempt.</p>
        </div>
      )}
    </div>
  );
};

const IeltsResult = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState(null);

  const loadResult = useCallback(async (silent = false) => {
    if (!attemptId) {
      setError("Attempt ID is missing from the URL.");
      setLoading(false);
      return;
    }

    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError("");

      const response = await api.get(`/ielts/attempts/${attemptId}/result`);
      if (response?.data?.success === false) {
        throw new Error(response?.data?.message || "Failed to load result");
      }

      const normalized = normalizeResult(response?.data?.data || response?.data);
      setResult(normalized);

      if (activeSection === null && normalized.sections.length > 0) {
        setActiveSection(0);
      }
    } catch (err) {
      console.error("IELTS result load error:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load IELTS result.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [attemptId, activeSection]);

  useEffect(() => {
    loadResult(false);
  }, [loadResult]);

  const orderedSections = useMemo(() => {
    const sections = [...(result?.sections || [])];
    return sections.sort((a, b) => {
      const ai = SECTION_ORDER.indexOf(a.section);
      const bi = SECTION_ORDER.indexOf(b.section);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [result]);

  const analysis = result?.analysis || {};
  const score = result?.score || {};
  const overall = score.overall ?? analysis.overallBand;
  const totalQuestions = safeNumber(analysis.totalQuestions);
  const attemptedQuestions = safeNumber(analysis.attemptedQuestions);
  const correctAnswers = safeNumber(analysis.correctAnswers);
  const incorrectAnswers = safeNumber(analysis.incorrectAnswers);
  const skippedQuestions = safeNumber(analysis.skippedQuestions);
  const accuracy = safeNumber(analysis.accuracy);
  const passTarget = result?.test?.passingBand ?? result?.test?.scoring?.passingBand ?? null;
  const isPassed = passTarget !== null && overall !== null && overall !== undefined
    ? safeNumber(overall) >= safeNumber(passTarget)
    : null;

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="ielts-result-page ielts-result-state">
        <Loader2 className="ielts-result-spin" size={42} />
        <h2>Loading your IELTS result</h2>
        <p>Preparing your score report and performance analysis…</p>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="ielts-result-page ielts-result-state">
        <div className="ielts-result-error-icon"><XCircle size={38} /></div>
        <h2>Unable to load result</h2>
        <p>{error}</p>
        <div className="ielts-result-state-actions">
          <button type="button" className="ielts-result-btn primary" onClick={() => loadResult(false)}>
            <RefreshCw size={17} /> Try again
          </button>
          <button type="button" className="ielts-result-btn secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={17} /> Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ielts-result-page">
      <div className="ielts-result-container">
        <header className="ielts-result-topbar">
          <button type="button" className="ielts-result-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Back
          </button>
          <div className="ielts-result-topbar-actions">
            <button type="button" className="ielts-result-icon-btn" onClick={() => loadResult(true)} disabled={refreshing} title="Refresh result">
              <RefreshCw className={refreshing ? "ielts-result-spin" : ""} size={18} />
            </button>
            <button type="button" className="ielts-result-btn secondary" onClick={handlePrint}>
              <Download size={17} /> Print / Save PDF
            </button>
          </div>
        </header>

        {error ? <div className="ielts-result-alert"><Info size={18} /> {error}</div> : null}

        <section className="ielts-result-hero">
          <div className="ielts-result-hero-copy">
            <div className="ielts-result-eyebrow"><Award size={16} /> IELTS Performance Report</div>
            <h1>{result?.test?.title || "IELTS Test Result"}</h1>
            <p>
              {result?.status === "completed" ? "Your test has been completed." : `Result status: ${humanize(result?.status || "available")}.`}
            </p>
            <div className="ielts-result-meta-row">
              <span>Attempt ID: {attemptId}</span>
              <span>Submitted: {formatDate(result?.submittedAt)}</span>
              <span>Completed: {formatDate(result?.completedAt)}</span>
            </div>
          </div>

          <div className="ielts-result-hero-score">
            <ScoreRing score={overall} label="Overall Band" />
            {isPassed !== null ? (
              <div className={`ielts-result-pass-badge ${isPassed ? "passed" : "failed"}`}>
                {isPassed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {isPassed ? "Passed" : "Below target"}
              </div>
            ) : null}
            {passTarget !== null ? <small>Target band: {formatBand(passTarget)}</small> : null}
          </div>
        </section>

        <section className="ielts-result-stats-grid">
          <StatCard icon={BarChart3} label="Total questions" value={totalQuestions} />
          <StatCard icon={Target} label="Attempted" value={attemptedQuestions} helper={`${formatPercentage(totalQuestions ? (attemptedQuestions / totalQuestions) * 100 : 0)} attempted`} />
          <StatCard icon={CheckCircle2} label="Correct" value={correctAnswers} />
          <StatCard icon={XCircle} label="Incorrect" value={incorrectAnswers} />
          <StatCard icon={Info} label="Skipped" value={skippedQuestions} />
          <StatCard icon={Clock3} label="Total time" value={formatDuration(analysis.totalTimeSpent)} helper={`Avg ${formatDuration(analysis.averageTimePerQuestion)} / question`} />
        </section>

        <section className="ielts-result-overview-grid">
          <div className="ielts-result-card ielts-result-performance-card">
            <div className="ielts-result-card-heading">
              <div>
                <span>Performance overview</span>
                <h2>Accuracy & attempt rate</h2>
              </div>
              <TrendingUp size={22} />
            </div>
            <div className="ielts-result-overview-metrics">
              <div className="ielts-result-big-metric">
                <strong>{formatPercentage(accuracy)}</strong>
                <span>Accuracy</span>
              </div>
              <div className="ielts-result-big-metric">
                <strong>{formatPercentage(totalQuestions ? (attemptedQuestions / totalQuestions) * 100 : 0)}</strong>
                <span>Attempt rate</span>
              </div>
            </div>
            <div className="ielts-result-dual-progress">
              <div>
                <div><span>Accuracy</span><strong>{formatPercentage(accuracy)}</strong></div>
                <div className="ielts-result-progress-track"><div className="ielts-result-progress-fill" style={{ width: `${Math.min(100, accuracy)}%` }} /></div>
              </div>
              <div>
                <div><span>Attempted</span><strong>{formatPercentage(totalQuestions ? (attemptedQuestions / totalQuestions) * 100 : 0)}</strong></div>
                <div className="ielts-result-progress-track"><div className="ielts-result-progress-fill secondary-fill" style={{ width: `${Math.min(100, totalQuestions ? (attemptedQuestions / totalQuestions) * 100 : 0)}%` }} /></div>
              </div>
            </div>
          </div>

          <div className="ielts-result-card ielts-result-summary-card">
            <div className="ielts-result-card-heading">
              <div>
                <span>Test information</span>
                <h2>Attempt summary</h2>
              </div>
              <FileText size={22} />
            </div>
            <div className="ielts-result-info-list">
              <div><span>Test type</span><strong>{humanize(result?.test?.testType)}</strong></div>
              <div><span>Difficulty</span><strong>{result?.test?.difficulty || "Mixed"}</strong></div>
              <div><span>Duration</span><strong>{result?.test?.duration ? `${result.test.duration} min` : "—"}</strong></div>
              <div><span>Started</span><strong>{formatDate(result?.startedAt)}</strong></div>
            </div>
          </div>
        </section>

        <section className="ielts-result-section-area">
          <div className="ielts-result-section-heading">
            <div>
              <span>Band scores</span>
              <h2>Section performance</h2>
            </div>
            <small>Click a section to see detailed performance.</small>
          </div>

          {orderedSections.length > 0 ? (
            <div className="ielts-result-section-grid">
              {orderedSections.map((section, index) => (
                <SectionScoreCard key={`${section.section}-${index}`} section={section} index={index} onOpen={setActiveSection} />
              ))}
            </div>
          ) : (
            <div className="ielts-result-empty-detail">No section analysis is available yet.</div>
          )}
        </section>

        {activeSection !== null && orderedSections[activeSection] ? (
          <section className="ielts-result-detail-section">
            <SectionDetail section={orderedSections[activeSection]} />
          </section>
        ) : null}

        <section className="ielts-result-recommendation-grid">
          <div className="ielts-result-card">
            <div className="ielts-result-card-heading">
              <div><span>What you did well</span><h2>Strengths</h2></div>
              <CheckCircle2 size={22} />
            </div>
            {Array.isArray(analysis.strengths) && analysis.strengths.length > 0 ? (
              <ul className="ielts-result-bullet-list positive-list">
                {analysis.strengths.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            ) : (
              <p className="ielts-result-muted">No overall strengths were returned by the evaluation service.</p>
            )}
          </div>

          <div className="ielts-result-card">
            <div className="ielts-result-card-heading">
              <div><span>Next focus</span><h2>Areas to improve</h2></div>
              <Target size={22} />
            </div>
            {Array.isArray(analysis.weaknesses) && analysis.weaknesses.length > 0 ? (
              <ul className="ielts-result-bullet-list">
                {analysis.weaknesses.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            ) : (
              <p className="ielts-result-muted">No overall improvement areas were returned by the evaluation service.</p>
            )}
          </div>

          <div className="ielts-result-card">
            <div className="ielts-result-card-heading">
              <div><span>Recommended next steps</span><h2>Study plan</h2></div>
              <TrendingUp size={22} />
            </div>
            {Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0 ? (
              <ol className="ielts-result-bullet-list numbered-list">
                {analysis.recommendations.map((item, index) => <li key={index}>{item}</li>)}
              </ol>
            ) : (
              <p className="ielts-result-muted">Recommendations will appear here when provided by the evaluation service.</p>
            )}
          </div>
        </section>

        <footer className="ielts-result-footer">
          <span>IELTS result report</span>
          <span>{attemptId}</span>
        </footer>
      </div>
    </div>
  );
};

export default IeltsResult;