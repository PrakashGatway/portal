// components/ielts/questions/SingleChoiceQuestion.jsx
import React from 'react';

export const SingleChoiceQuestion = ({ question, answer, setAnswer }) => {
  return (
    <div className="question-type single-choice">
      <div className="question-text">
        <p>{question.content}</p>
      </div>
      
      {question.instructions && (
        <p className="question-instructions">{question.instructions}</p>
      )}
      
      <div className="choices">
        {question.choices?.map((choice, idx) => (
          <label key={idx} className="choice-item">
            <input
              type="radio"
              name="answer"
              value={choice.label}
              checked={answer === choice.label}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <span className="choice-label">{choice.label}</span>
            <span className="choice-text">{choice.text}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export const MultipleChoiceQuestion = ({ question, answer, setAnswer }) => {
  const handleAnswerChange = (choiceLabel) => {
    const currentAnswers = Array.isArray(answer) ? answer : [];
    const newAnswers = currentAnswers.includes(choiceLabel)
      ? currentAnswers.filter(a => a !== choiceLabel)
      : [...currentAnswers, choiceLabel];
    setAnswer(newAnswers);
  };

  return (
    <div className="question-type multiple-choice">
      <div className="question-text">
        <p>{question.content}</p>
      </div>
      
      {question.instructions && (
        <p className="question-instructions">{question.instructions}</p>
      )}
      
      <p className="hint">Select all that apply</p>
      
      <div className="choices">
        {question.choices?.map((choice, idx) => (
          <label key={idx} className="choice-item">
            <input
              type="checkbox"
              checked={Array.isArray(answer) && answer.includes(choice.label)}
              onChange={() => handleAnswerChange(choice.label)}
            />
            <span className="choice-label">{choice.label}</span>
            <span className="choice-text">{choice.text}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export const TrueFalseNGQuestion = ({ question, answer, setAnswer, questionType }) => {
  const options = questionType === 'true_false_ng'
    ? ['True', 'False', 'Not Given']
    : ['Yes', 'No', 'Not Given'];

  return (
    <div className="question-type true-false-ng">
      <div className="question-text">
        <p>{question.content}</p>
      </div>
      
      <div className="choices horizontal">
        {options.map((option, idx) => (
          <label key={idx} className="choice-item horizontal">
            <input
              type="radio"
              name="answer"
              value={option}
              checked={answer === option}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <span className="choice-text">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

// components/ielts/questions/CompletionQuestion.jsx
import { useState } from 'react';

export const CompletionQuestion = ({ question, answer, setAnswer }) => {
  const [inputValue, setInputValue] = useState(answer || '');
  
  const renderContent = () => {
    if (!question.content) return null;
    
    // If content contains {{1}}, {{2}}, etc., render with input fields
    const parts = question.content.split(/(\{\{\d+\}\})/g);
    
    return parts.map((part, idx) => {
      const match = part.match(/\{\{(\d+)\}\}/);
      
      if (match) {
        const inputNumber = match[1];
        return (
          <input
            key={idx}
            type="text"
            className="completion-input"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setAnswer(e.target.value);
            }}
            placeholder={`Answer ${inputNumber}`}
          />
        );
      }
      
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="question-type completion">
      {question.instructions && (
        <p className="question-instructions">{question.instructions}</p>
      )}
      
      <div className="completion-content">
        {renderContent()}
      </div>
      
      {question.constraints?.maxWords && (
        <p className="word-limit">
          Write NO MORE THAN {question.constraints.maxWords} WORDS
        </p>
      )}
    </div>
  );
};


export const MatchingQuestion = ({ question, answer, setAnswer }) => {
  return (
    <div className="question-type matching">
      <div className="question-text">
        <p>{question.content}</p>
      </div>
      
      {question.instructions && (
        <p className="question-instructions">{question.instructions}</p>
      )}
      
      <div className="matching-options">
        <h4>Choose from the following options:</h4>
        {question.choices?.map((choice, idx) => (
          <div key={idx} className="matching-option">
            <span className="option-label">{choice.label}.</span>
            <span className="option-text">{choice.text}</span>
          </div>
        ))}
      </div>
      
      <div className="matching-answer">
        <label>Your answer:</label>
        <select
          value={answer || ''}
          onChange={(e) => setAnswer(e.target.value)}
          className="matching-select"
        >
          <option value="">Select...</option>
          {question.choices?.map((choice, idx) => (
            <option key={idx} value={choice.label}>
              {choice.label} - {choice.text}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export const EssayWritingQuestion = ({ question, answer, setAnswer }) => {
  return (
    <div className="question-type essay-writing">
      <div className="writing-prompt">
        <h3>{question.content}</h3>
        {question.instructions && (
          <p className="instructions">{question.instructions}</p>
        )}
        
        {question.metadata?.taskType && (
          <p className="task-type">Task: {question.metadata.taskType}</p>
        )}
        
        {question.metadata?.minWords && (
          <p className="word-requirement">
            You should write at least {question.metadata.minWords} words.
          </p>
        )}
      </div>
      
      <div className="writing-area">
        <div className="writing-toolbar">
          <span>Word Count: {answer ? answer.split(/\s+/).filter(w => w).length : 0}</span>
        </div>
        <textarea
          className="essay-textarea"
          value={answer || ''}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Write your essay here..."
          rows={15}
        />
      </div>
    </div>
  );
};

export const LetterWritingQuestion = ({ question, answer, setAnswer }) => {
  return (
    <div className="question-type letter-writing">
      <div className="writing-prompt">
        <h3>{question.content}</h3>
        {question.instructions && (
          <p className="instructions">{question.instructions}</p>
        )}
        
        <div className="letter-format">
          <p>Begin your letter as follows:</p>
          <p className="letter-salutation">Dear Sir or Madam,</p>
        </div>
      </div>
      
      <div className="writing-area">
        <div className="writing-toolbar">
          <span>Word Count: {answer ? answer.split(/\s+/).filter(w => w).length : 0}</span>
        </div>
        <textarea
          className="letter-textarea"
          value={answer || ''}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Write your letter here..."
          rows={15}
        />
      </div>
    </div>
  );
};

export const SpeakingQuestion = ({ question, answer, setAnswer }) => {
  const isPartTwo = question.questionType === 'speaking_part_2';
  
  return (
    <div className="question-type speaking">
      <div className="speaking-prompt">
        <h3>{question.content}</h3>
        
        {isPartTwo && question.metadata?.cueCardPoints && (
          <div className="cue-card">
            <h4>You should say:</h4>
            <ul>
              {question.metadata.cueCardPoints.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>
        )}
        
        {question.metadata?.preparationTime && (
          <p className="prep-time">
            Preparation Time: {question.metadata.preparationTime} seconds
          </p>
        )}
        
        {question.metadata?.responseTime && (
          <p className="response-time">
            Speaking Time: {question.metadata.responseTime} seconds
          </p>
        )}
      </div>
      
      <div className="speaking-recording">
        <button className="record-btn">Start Recording</button>
        <div className="recording-indicator">
          <span className="recording-dot"></span>
          <span>Recording...</span>
        </div>
        <div className="recording-timer">00:00</div>
      </div>
      
      <div className="speaking-notes">
        <label>Notes (optional):</label>
        <textarea
          value={answer || ''}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Take notes here..."
          rows={5}
        />
      </div>
    </div>
  );
};

export const ListeningMatchingQuestion = ({ question, answer, setAnswer }) => {
  return (
    <div className="question-type listening-matching">
      <div className="question-text">
        <p>{question.content}</p>
      </div>
      
      <div className="matching-table">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Answer</th>
            </tr>
          </thead>
          <tbody>
            {question.content?.split('\n').map((item, idx) => (
              <tr key={idx}>
                <td>{item}</td>
                <td>
                  <select
                    value={Array.isArray(answer) ? answer[idx] : ''}
                    onChange={(e) => {
                      const newAnswers = [...(answer || [])];
                      newAnswers[idx] = e.target.value;
                      setAnswer(newAnswers);
                    }}
                  >
                    <option value="">Select...</option>
                    {question.choices?.map((choice, choiceIdx) => (
                      <option key={choiceIdx} value={choice.label}>
                        {choice.label} - {choice.text}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const PickFromListQuestion = ({ question, answer, setAnswer }) => {
  return (
    <div className="question-type pick-from-list">
      <div className="question-text">
        <p>{question.content}</p>
      </div>
      
      <div className="pick-list">
        {question.choices?.map((choice, idx) => (
          <label key={idx} className="pick-item">
            <input
              type="checkbox"
              checked={Array.isArray(answer) && answer.includes(choice.label)}
              onChange={(e) => {
                const current = Array.isArray(answer) ? answer : [];
                const newAnswer = e.target.checked
                  ? [...current, choice.label]
                  : current.filter(a => a !== choice.label);
                setAnswer(newAnswer);
              }}
            />
            <span className="choice-label">{choice.label}</span>
            <span className="choice-text">{choice.text}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

import { Clock, Book, Headphones, PenTool, Mic } from 'lucide-react';

export const TestInstructions = ({ testData, onStart }) => {
  const getSectionIcon = (section) => {
    switch (section) {
      case 'reading': return <Book size={24} />;
      case 'listening': return <Headphones size={24} />;
      case 'writing': return <PenTool size={24} />;
      case 'speaking': return <Mic size={24} />;
      default: return <Book size={24} />;
    }
  };

  return (
    <div className="test-instructions">
      <div className="instructions-container">
        <h1>{testData?.title || 'IELTS Test'}</h1>
        
        {testData?.description && (
          <p className="test-description">{testData.description}</p>
        )}
        
        <div className="test-info">
          <div className="info-item">
            <Clock size={20} />
            <span>Total Duration: {testData?.duration || 0} minutes</span>
          </div>
          <div className="info-item">
            <span>Type: {testData?.testType?.replace('_', ' ')}</span>
          </div>
          <div className="info-item">
            <span>Difficulty: {testData?.difficulty || 'Mixed'}</span>
          </div>
        </div>
        
        <div className="sections-overview">
          <h2>Test Structure</h2>
          {testData?.sections?.map((section, idx) => (
            <div key={idx} className="section-card">
              <div className="section-header">
                <div className="section-icon">
                  {getSectionIcon(section.section)}
                </div>
                <div className="section-details">
                  <h3>Section {idx + 1}: {section.section.toUpperCase()}</h3>
                  <p>Duration: {section.duration} minutes</p>
                  <p>Questions: {section.questionCount || 'Varies'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {testData?.instructions && (
          <div className="test-specific-instructions">
            <h2>Instructions</h2>
            <p>{testData.instructions}</p>
          </div>
        )}
        
        <div className="general-instructions">
          <h2>Important Notes</h2>
          <ul>
            <li>Make sure you have a stable internet connection</li>
            <li>Do not refresh the page during the test</li>
            <li>Your answers will be saved automatically</li>
            <li>You can flag questions to review later</li>
            <li>Keep track of the timer for each section</li>
            <li>For listening sections, audio plays only once</li>
            <li>For writing sections, plan your time carefully</li>
          </ul>
        </div>
        
        <button className="start-test-btn" onClick={onStart}>
          Start Test
        </button>
      </div>
    </div>
  );
};



// components/ielts/IeltsResult.jsx
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import axios from 'axios';
import { 
  Award, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  BarChart2,
  Download,
  RefreshCw,
  Home
} from 'lucide-react';
import './IeltsResult.css';

export const IeltsResult = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('overall');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/ielts/attempts/${attemptId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setResult(response.data.data);
      } catch (error) {
        setError('Failed to load test results');
        console.error('Fetch result error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="result-loading">
        <div className="loading-spinner"></div>
        <p>Calculating your results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="result-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/ielts/tests')}>Back to Tests</button>
      </div>
    );
  }

  const analysis = result.analysis || {};
  const score = result.score || {};

  return (
    <div className="ielts-result-page">
      <header className="result-header">
        <h1>Test Results</h1>
        <div className="result-actions">
          <button className="secondary-btn" onClick={() => navigate('/ielts/tests')}>
            <Home size={20} />
            All Tests
          </button>
          <button className="secondary-btn" onClick={() => navigate(`/ielts/take/${result.test._id}`)}>
            <RefreshCw size={20} />
            Retake Test
          </button>
          <button className="primary-btn" onClick={() => window.print()}>
            <Download size={20} />
            Download
          </button>
        </div>
      </header>

      <main className="result-content">
        {/* Overall Score Card */}
        <section className="score-card">
          <div className="score-header">
            <h2>{result.test?.title || 'IELTS Test'}</h2>
            <p>Completed on {formatDate(result.submittedAt)}</p>
          </div>

          <div className="overall-band">
            <div className="band-score">
              <span className="band-number">{analysis.overallBand || score.overall || 'N/A'}</span>
              <span className="band-label">Overall Band Score</span>
            </div>
          </div>

          <div className="section-bands">
            {result.sections?.map((section, idx) => (
              <div key={idx} className="section-band">
                <div className="band-header">
                  <h3>{section.section.toUpperCase()}</h3>
                  <span className="band-value">
                    {section.analysis?.bandScore || section.analysis?.rawScore || 'N/A'}
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${(section.analysis?.accuracy || 0)}%` }}
                  />
                </div>
                <div className="section-stats">
                  <span>Correct: {section.analysis?.correctAnswers || 0}</span>
                  <span>Accuracy: {section.analysis?.accuracy || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Detailed Analysis */}
        <section className="analysis-section">
          <div className="analysis-tabs">
            <button 
              className={activeSection === 'overall' ? 'active' : ''}
              onClick={() => setActiveSection('overall')}
            >
              Overall
            </button>
            {result.sections?.map((section, idx) => (
              <button
                key={idx}
                className={activeSection === section.section ? 'active' : ''}
                onClick={() => setActiveSection(section.section)}
              >
                {section.section.toUpperCase()}
              </button>
            ))}
          </div>

          {activeSection === 'overall' ? (
            <OverallAnalysis analysis={analysis} />
          ) : (
            <SectionAnalysis 
              section={result.sections?.find(s => s.section === activeSection)} 
            />
          )}
        </section>

        {/* Strengths and Weaknesses */}
        {analysis.strengths?.length > 0 && (
          <section className="strengths-weaknesses">
            <div className="strengths">
              <h3><TrendingUp size={20} /> Strengths</h3>
              <ul>
                {analysis.strengths.map((strength, idx) => (
                  <li key={idx}>{strength}</li>
                ))}
              </ul>
            </div>
            {analysis.weaknesses?.length > 0 && (
              <div className="weaknesses">
                <h3><BarChart2 size={20} /> Areas for Improvement</h3>
                <ul>
                  {analysis.weaknesses.map((weakness, idx) => (
                    <li key={idx}>{weakness}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Recommendations */}
        {analysis.recommendations?.length > 0 && (
          <section className="recommendations">
            <h3><Award size={20} /> Recommendations</h3>
            <ul>
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
};

const OverallAnalysis = ({ analysis }) => {
  return (
    <div className="overall-analysis">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><CheckCircle size={24} /></div>
          <div className="stat-value">{analysis.correctAnswers || 0}</div>
          <div className="stat-label">Correct Answers</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><XCircle size={24} /></div>
          <div className="stat-value">{analysis.incorrectAnswers || 0}</div>
          <div className="stat-label">Incorrect Answers</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Clock size={24} /></div>
          <div className="stat-value">{analysis.totalTimeSpent ? Math.round(analysis.totalTimeSpent / 60) : 0}m</div>
          <div className="stat-label">Time Spent</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Award size={24} /></div>
          <div className="stat-value">{analysis.accuracy || 0}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
      </div>

      {analysis.summary && (
        <div className="summary">
          <h4>Summary</h4>
          <p>{analysis.summary}</p>
        </div>
      )}
    </div>
  );
};

const SectionAnalysis = ({ section }) => {
  if (!section) return null;
  
  const analysis = section.analysis || {};
  
  return (
    <div className="section-analysis">
      <h3>{section.section.toUpperCase()} Section Analysis</h3>
      
      <div className="section-stats-grid">
        <div className="stat-item">
          <span className="stat-label">Raw Score</span>
          <span className="stat-value">{analysis.rawScore || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Questions</span>
          <span className="stat-value">{analysis.totalQuestions || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Correct</span>
          <span className="stat-value">{analysis.correctAnswers || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Incorrect</span>
          <span className="stat-value">{analysis.incorrectAnswers || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Skipped</span>
          <span className="stat-value">{analysis.skippedQuestions || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Accuracy</span>
          <span className="stat-value">{analysis.accuracy || 0}%</span>
        </div>
      </div>

      {analysis.feedback && (
        <div className="feedback">
          <h4>Feedback</h4>
          <p>{analysis.feedback}</p>
        </div>
      )}

      {/* Question-wise breakdown */}
      <div className="question-breakdown">
        <h4>Question Breakdown</h4>
        {section.groups?.map((group, groupIdx) => (
          <div key={groupIdx} className="breakdown-group">
            <h5>Group {groupIdx + 1}</h5>
            {group.questionSets?.map((set, setIdx) => (
              <div key={setIdx} className="breakdown-set">
                {set.questions?.map((question, questionIdx) => (
                  <div key={questionIdx} className="breakdown-question">
                    <span className="question-number">Q{questionIdx + 1}</span>
                    <span className={`question-status ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                      {question.isCorrect ? '✓' : '✗'}
                    </span>
                    <span className="question-time">
                      {question.timeSpent}s
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
