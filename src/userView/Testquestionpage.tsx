import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "react-router";
import { get, useForm } from "react-hook-form";
import api from "../axiosInstance";

const TestQuestionPage = () => {
  const { testId } = useParams();
  const location = useLocation();
  const { register, watch, setValue, handleSubmit, formState: { errors } } = useForm();
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Theme classes
  const theme = {
    background: darkMode ? 'bg-gray-900' : 'bg-gray-100',
    surface: darkMode ? 'bg-gray-800' : 'bg-white',
    surfaceLight: darkMode ? 'bg-gray-700' : 'bg-gray-50',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: darkMode ? 'text-gray-300' : 'text-gray-600',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
    border: darkMode ? 'border-gray-700' : 'border-gray-300',
    accent: darkMode ? 'bg-blue-600' : 'bg-blue-500',
    accentHover: darkMode ? 'hover:bg-blue-700' : 'hover:bg-blue-600',
    success: darkMode ? 'bg-green-600' : 'bg-green-500',
    successHover: darkMode ? 'hover:bg-green-700' : 'hover:bg-green-600',
    danger: darkMode ? 'bg-red-600' : 'bg-red-500',
    input: darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900',
    inputFocus: darkMode ? 'focus:border-blue-500 focus:ring-blue-500' : 'focus:border-blue-500 focus:ring-blue-500',
  };
  


    





  // Helper functions
  const hasPlaceholders = (questionText) => {
    return questionText?.includes('{{') || false;
  };

  const renderPlaceholderQuestion = (questionText, questionId, startingNumber) => {
    if (!questionText) return null;

    const parts = [];
    const regex = /\{\{(\d+)\}\}/g;
    let lastIndex = 0;
    let match;
    let index = 0;
    let currentQuestionNumber = startingNumber;

    while ((match = regex.exec(questionText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${index}`} className={theme.text}>
            {questionText.slice(lastIndex, match.index)}
          </span>
        );
        index++;
      }

      const placeholderIndex = match[1];
      const subQuestionId = `${questionId}_${placeholderIndex}`;

      parts.push(
        <span key={`input-${index}`} className="inline-flex items-center mx-1">
          <input
            type="text"
            {...register(subQuestionId)}
            placeholder={`Answer ${currentQuestionNumber}`}
            className={`border-b-2 ${darkMode ? 'border-gray-400 focus:border-blue-500' : 'border-gray-600 focus:border-blue-600'} focus:outline-none px-2 py-1 w-32 bg-transparent ${theme.text} inline-block align-middle`}
          />
        </span>
      );
      index++;
      currentQuestionNumber++;
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < questionText.length) {
      parts.push(
        <span key={`text-${index}`} className={theme.text}>
          {questionText.slice(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  // Add this debug function
  const debugQuestionGroups = () => {
    const questionGroups = extractQuestionGroups();
    console.log("=== QUESTION GROUPS DEBUG ===");
    questionGroups.forEach((group, index) => {
      console.log(`Group ${index}:`, {
        type: group.type,
        commonOptions: group.commonOptions,
        instruction: group.instruction,
        questionCount: group.questions?.length
      });
    });
    console.log("=== END DEBUG ===");
  };

  // Call it when testData loads
  useEffect(() => {
    if (testData) {
      debugQuestionGroups();
    }
  }, [testData]);



  // Function to handle multiple choice selection
  const handleMultipleChoiceChange = (questionId, optionLabel, optionText, isChecked) => {
    const currentAnswers = watch(questionId) ? JSON.parse(watch(questionId)) : [];

    if (isChecked) {
      const newAnswers = [...currentAnswers, { label: optionLabel, text: optionText }];
      setValue(questionId, JSON.stringify(newAnswers));
    } else {
      const newAnswers = currentAnswers.filter(answer => answer.label !== optionLabel);
      setValue(questionId, JSON.stringify(newAnswers));
    }
  };

  // Function to check if an option is selected in multiple choice
  const isOptionSelected = (questionId, optionLabel) => {
    const currentAnswers = watch(questionId) ? JSON.parse(watch(questionId)) : [];
    return currentAnswers.some(answer => answer.label === optionLabel);
  };

  // Function to get selected count for multiple choice
  const getSelectedCount = (questionId) => {
    const currentAnswers = watch(questionId) ? JSON.parse(watch(questionId)) : [];
    return currentAnswers.length;
  };

  // Get options for dropdown questions from commonOptions - DIRECT FROM API
  const getCommonOptions = (questionGroups, questionIndex) => {
    const allQuestions = getAllQuestions();
    const currentQuestion = allQuestions?.[questionIndex];

    // Find the group that contains this question
    for (const group of questionGroups) {
      if (group?.questions?.some(q =>
        q?._id === currentQuestion?._id ||
        q?.id === currentQuestion?.id ||
        q?.text === currentQuestion?.text ||
        q?.question === currentQuestion?.question
      )) {
        // Return commonOptions directly from API, no defaults
        if (group.commonOptions) {
          if (typeof group.commonOptions === 'string') {
            return group.commonOptions.split(',').map(opt => opt.trim());
          } else if (Array.isArray(group.commonOptions)) {
            return group.commonOptions;
          }
        }
        // If no commonOptions in API, return empty array
        return [];
      }
    }

    // If no group found, return empty array
    return [];
  };

  // Add debug to findQuestionGroupType to see what types are detected
  const findQuestionGroupType = (questionIndex) => {
    const questionGroups = extractQuestionGroups();

    let currentIndex = 0;
    for (const group of questionGroups) {
      const groupQuestionCount = group?.questions?.length || 0;
      if (questionIndex >= currentIndex && questionIndex < currentIndex + groupQuestionCount) {
        console.log(`🔍 Question ${questionIndex} group type:`, group?.type);
        return group?.type || 'default';
      }
      currentIndex += groupQuestionCount;
    }

    console.log(`🔍 Question ${questionIndex} using default type`);
    return 'default';
  };
  const SafeQuestionRenderer = ({ question, questionId, index, groupType }) => {
    try {
      if (!question || typeof question !== 'object') {
        return <div className="text-red-500">Invalid question data</div>;
      }

      const questionText = getSafeQuestionText(question);
      const safeQuestion = {
        ...question,
        text: questionText,
        question: questionText
      };

      return renderQuestionByType(safeQuestion, questionId, index, groupType);

    } catch (error) {
      console.error('Error rendering question:', error);
      return <div className="text-red-500">Error rendering question</div>;
    }
  };

  // Main function to render questions based on group type using switch-case
  const renderQuestionByType = (question, questionId, questionIndex, groupType) => {
    const questionText = getSafeQuestionText(question);

    if (hasPlaceholders(questionText)) {
      return renderSummaryCompletion(question, questionId, questionIndex);
    }

    switch (groupType) {
      case 'matching_information':
        return renderMatchingInformation(question, questionId, questionIndex);

      case 'multiple_choice_multiple':
        return renderMultipleChoiceMultiple(question, questionId, questionIndex);

      case 'multiple_choice_single':
        return renderMultipleChoiceSingle(question, questionId, questionIndex);

      // case 'matching_features':
      //   return renderMatchingFeatures(question, questionId, questionIndex);

      case "yes_no_not_given":
      case "true_false_not_given":
      case "matching_features":
        return renderYes_No_Not_Given(question, questionId, questionIndex)

      default:
        return renderDefaultQuestion(question, questionId, questionIndex);
    }
  };

  const renderYes_No_Not_Given = (question, questionId, questionIndex) => {
    const questionText = getSafeQuestionText(question);

    // Get the question groups to find the current group's commonOptions
    const questionGroups = extractQuestionGroups();

    // Find the current question's group to get commonOptions
    let options = [];

    // Find which group this question belongs to
    let currentIndex = 0;
    for (const group of questionGroups) {
      const groupQuestionCount = group?.questions?.length || 0;
      if (questionIndex >= currentIndex && questionIndex < currentIndex + groupQuestionCount) {
        // Found the group - use its commonOptions directly from API
        if (group.commonOptions) {
          if (typeof group.commonOptions === 'string') {
            // Use the commonOptions string directly from API
            options = group.commonOptions.split(',').map(opt => opt.trim());
          } else if (Array.isArray(group.commonOptions)) {
            options = group.commonOptions;
          }
        }
        break;
      }
      currentIndex += groupQuestionCount;
    }

    return (
      <div className="flex-1">
        <label className="block text-lg font-medium text-white mb-3">
          {questionText || `Question ${questionIndex + 1}`}
        </label>
        <select
          {...register(questionId)}
          className="w-full px-4 py-3 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
        >
          <option value="">Select an option</option>
          {options?.map((option, optIndex) => (
            <option key={optIndex} value={option}>{option}</option>
          ))}
        </select>
      </div>
    );
  }

  const renderMatchingFeatures = (question, questionId, questionIndex) => {
    const questionText = getSafeQuestionText(question)
    const options = getCommonOptions(extractQuestionGroups(), questionIndex);
    console.log("Matching Features Options:", options);

    return (
      <div className="flex-1">
        <label className="block text-lg font-medium text-white mb-3">
          {questionText || `Question ${questionIndex + 1}`}
        </label>
        <select
          {...register(questionId)}
          className="w-full px-4 py-3 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
        >
          <option value="">Select an option</option>
          {options?.map((option, optIndex) => (
            <option key={optIndex} value={option}>{option}</option>
          ))}
        </select>
      </div>

    )
  }

  const renderMultipleChoiceSingle = (question, questionId, questionIndex) => {
    const questionText = getSafeQuestionText(question);
    const options = question?.options || [];
    return (
      <div className="flex-1">
        <label className="block text-lg font-medium text-white mb-3">
          {questionText || `Question ${questionIndex + 1}`}
        </label>
        <div className="space-y-3">
          {options?.map((option, optIndex) => (
            <label key={option?._id || optIndex} className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-700">
              <input
                type="radio"
                value={option?.label}
                {...register(questionId)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-1 flex-shrink-0"
              />
              <div className="flex-1">
                <span className="text-white font-medium">{option?.label}. </span>
                <span className="text-gray-300">{option?.text}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    )
  }


  // Render matching information questions (dropdown with commonOptions)
  const renderMatchingInformation = (question, questionId, questionIndex) => {
    const questionText = getSafeQuestionText(question);
    const questionGroups = extractQuestionGroups();
    const options = getCommonOptions(questionGroups, questionIndex);

    return (
      <div className="flex-1">
        <label className="block text-lg font-medium text-white mb-3">
          {questionText || `Question ${questionIndex + 1}`}
        </label>
        <select
          {...register(questionId)}
          className="w-full px-4 py-3 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
        >
          <option value="">Select an option</option>
          {options?.map((option, optIndex) => (
            <option key={optIndex} value={option}>{option}</option>
          ))}
        </select>
      </div>
    );
  };

  // Safe text extraction helper
  const getSafeQuestionText = (question) => {
    if (!question) return '';

    if (typeof question.text === 'string') return question.text;
    if (typeof question.question === 'string') return question.question;
    if (typeof question.content === 'string') return question.content;

    if (question.text && typeof question.text === 'object') {
      return question.text.content || question.text.text || '';
    }

    if (question.question && typeof question.question === 'object') {
      return question.question.content || question.question.text || '';
    }

    if (question.content && typeof question.content === 'object') {
      return question.content.text || question.content.content || '';
    }

    return '';
  };

  // Render summary completion questions (with placeholders)
  const renderSummaryCompletion = (question, questionId, questionIndex) => {
    const questionText = getSafeQuestionText(question);
    const startingNumber = calculateQuestionStartingNumber(questionIndex);

    return (
      <div className="flex-1">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-gray-200 text-lg leading-relaxed">
            {renderPlaceholderQuestion(questionText, questionId, startingNumber)}
          </div>
        </div>
      </div>
    );
  };

  // Render multiple choice multiple questions (checkboxes)
  const renderMultipleChoiceMultiple = (question, questionId, questionIndex) => {
    const questionText = getSafeQuestionText(question);
    const options = question?.options || [];
    const startingNumber = calculateQuestionStartingNumber(questionIndex);

    const isTwoAnswersQuestion = questionText?.includes('TWO') ||
      questionText?.includes('10-11') ||
      questionText?.includes('12-13');

    let questionNumberDisplay;
    if (isTwoAnswersQuestion) {
      questionNumberDisplay = `${startingNumber}-${startingNumber + 1}`;
    } else {
      questionNumberDisplay = startingNumber.toString();
    }

    return (
      <div className="flex-1">
        <label className="block text-lg font-medium text-white mb-3">
          {isTwoAnswersQuestion ? `Questions ${questionNumberDisplay}: ${questionText}` : (questionText || `Question ${questionIndex + 1}`)}
        </label>
        <div className="text-sm text-gray-400 mb-3">
          {isTwoAnswersQuestion ? 'Choose TWO letters' : 'Choose all that apply'} ({getSelectedCount(questionId)} selected)
        </div>
        <div className="space-y-3">
          {options?.map((option, optIndex) => (
            <label key={option?._id || optIndex} className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-700">
              <input
                type="checkbox"
                checked={isOptionSelected(questionId, option?.label)}
                onChange={(e) => handleMultipleChoiceChange(questionId, option?.label, option?.text, e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-1 flex-shrink-0"
              />
              <div className="flex-1">
                <span className="text-white font-medium">{option?.label}. </span>
                <span className="text-gray-300">{option?.text}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    );
  };

  // Render default question type
  const renderDefaultQuestion = (question, questionId, questionIndex) => {
    const questionText = getSafeQuestionText(question);

    return (
      <div className="flex-1">
        <label className="block text-lg font-medium text-white mb-3">
          {questionText || `Question ${questionIndex + 1}`}
        </label>
        <input
          type="text"
          {...register(questionId)}
          placeholder="Enter your answer..."
          className="w-full px-4 py-3 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
        />
      </div>
    );
  };

  // Calculate word count for writing tasks
  const calculateWordCount = (text) => {
    if (!text || text.trim() === '') return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Get progress info from API response
  const getProgressInfo = () => {
    if (!testData) return { current: 0, total: 0 };

    return {
      current: testData?.currentQuestion ?? testData?.progress?.currentQuestion ?? 1,
      total: testData?.totalQuestions ?? testData?.progress?.totalQuestions ?? 3
    };
  };

  const seeAllFormValues = () => {
    const formValues = watch();
    console.log("=== ALL FORM VALUES ===");

    Object.keys(formValues).forEach(key => {
      console.log(`Field: ${key}, Value:`, formValues[key]);
    });

    console.log("=== END ===");
  };

  const handleNextQuestion = async () => {
    try {
      setIsSubmitting(true);
      seeAllFormValues()

      // Get current answers
      const currentAnswers = watch();
      const formattedAnswers = formatAnswersForSubmission(currentAnswers);

      // Submit current answers
      try {
        const submissionData = {
          answers: formattedAnswers,
          lastQuestionIndex: currentQuestionIndex,
          timeSpent: 60 * 60 - timeLeft,
          completed: false
        };
        console.log("📝 Submitting answers before navigation:", submissionData);

        const response = await api.post(`/test/session/${sessionId}/submit`, submissionData);

        if (response.data.success) {
          // Check if we have next question data
          if (response.data.currentQuestion || response.data.nextQuestion) {
            setTestData(prev => ({
              ...prev,
              ...response.data,
              progress: response.data.progress || prev.progress
            }));
          }

          // Move to next question
          const allQuestions = getAllQuestions();
          if (currentQuestionIndex < (allQuestions?.length || 0) - 1) {
            const newIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(newIndex);

            // Clear form for new question
            Object.keys(currentAnswers).forEach(key => {
              setValue(key, '');
            });

            console.log("➡️ Moved to question index:", newIndex);
          } else {
            console.log("🎉 All questions completed!");
            await handleFinalSubmission(currentAnswers);
          }
        }
      } catch (submitError) {
        console.log("⚠️ Submission failed, continuing with navigation:", submitError);
        // Manual navigation as fallback
        const allQuestions = getAllQuestions();
        if (currentQuestionIndex < (allQuestions?.length || 0) - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          Object.keys(currentAnswers).forEach(key => {
            setValue(key, '');
          });
        }
      }

    } catch (err) {
      console.error("❌ Navigation error:", err);
      alert("Error moving to next question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };



  // Format answers for submission in the exact API structure
  const formatAnswersForSubmission = (formData) => {
    const answers = [];
    const allQuestions = getAllQuestions();

    allQuestions?.forEach((question, index) => {
      const questionId = question?._id || question?.id;
      const questionText = getSafeQuestionText(question);
      const groupType = findQuestionGroupType(index);

      if (!questionId) return;

      if (groupType === 'summary_completion' && hasPlaceholders(questionText)) {
        const placeholderCount = (questionText.match(/\{\{\d+\}\}/g) || []).length;
        for (let i = 1; i <= placeholderCount; i++) {
          const subQuestionId = `${questionId}_${i}`;
          if (formData[subQuestionId]) {
            answers.push({
              questionId: questionId,
              answer: formData[subQuestionId]
            });
          }
        }
      } else if (groupType === 'multiple_choice_multiple') {
        const selectedOptions = formData[questionId] ? JSON.parse(formData[questionId]) : [];
        const answerLabels = selectedOptions.map(opt => opt?.label).filter(Boolean);
        if (answerLabels.length > 0) {
          answers.push({
            questionId: questionId,
            answer: answerLabels
          });
        }
      } else if (groupType === 'matching_information') {
        if (formData[questionId]) {
          answers.push({
            questionId: questionId,
            answer: formData[questionId]
          });
        }
      } else {
        if (formData[questionId]) {
          answers.push({
            questionId: questionId,
            answer: formData[questionId]
          });
        }
      }
    });

    const progress = getProgressInfo();
    if (formData[`writing_${progress.current}`]) {
      answers.push({
        questionId: `writing_${progress.current}`,
        answer: formData[`writing_${progress.current}`]
      });
    }

    return answers;
  };


  // ✅ NEW: Map API saved answers back to form field values
const loadSavedAnswersForQuestion = (questionId, savedAnswersArray) => {
  if (!savedAnswersArray || !Array.isArray(savedAnswersArray)) return {};

  const matchingAnswer = savedAnswersArray.find(
    item => item.questionId === questionId
  );

  if (!matchingAnswer) return {};

  const { answer } = matchingAnswer;

  // Handle different answer types based on your API structure
  if (typeof answer === 'string') {
    return { [questionId]: answer };
  } else if (Array.isArray(answer)) {
    // For multiple choice multiple: answer is array of labels → stringify for form
    return { [questionId]: JSON.stringify(answer.map(label => ({ label, text: '' }))) };
  } else {
    return {};
  }
};



  // Debug function
  const debugObjectRendering = () => {
    if (!testData) return;

    console.log("=== OBJECT RENDERING DEBUG ===");
    const allQuestions = getAllQuestions();

    allQuestions?.forEach((q, index) => {
      console.log(`Question ${index}:`, q);
      const propsToCheck = ['text', 'question', 'content', 'title', 'instruction'];
      let hasObjectProps = false;

      propsToCheck.forEach(prop => {
        if (q && q[prop] && typeof q[prop] === 'object') {
          console.error(`❌ OBJECT PROPERTY: Question ${index}, property "${prop}":`, q[prop]);
          hasObjectProps = true;
        }
      });

      if (!hasObjectProps) {
        console.log(`✅ Question ${index} has no object properties`);
      }
    });
  };

  useEffect(() => {
    if (testData) {
      debugObjectRendering();
    }
  }, [testData]);

  // Fetch test data from API using test series ID
  useEffect(() => {
    if (!testId) return;

    const fetchTestData = async () => {
      try {
        setLoading(true);
        const response = await api.post('/test/start', {
          testSeriesId: testId
        });

        setTestData(response.data);

        const sessionId = response.data?.sessionId ||
          response.data?.testSessionId ||
          response.data?.data?.sessionId ||
          response.data?.data?.testSessionId;
        setSessionId(sessionId);

        if (response.data.timeRemaining) {
          setTimeLeft(response.data.timeRemaining);
        } else if (response.data.duration || response.data?.data?.duration) {
          const duration = response.data.duration || response.data?.data?.duration;
          setTimeLeft(duration * 60);
        }

        if (response.data.lastQuestionIndex !== undefined) {
          setCurrentQuestionIndex(response.data.lastQuestionIndex);
        }

      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load test");
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [testId]);

  // Debug useEffect to check question groups and types
  useEffect(() => {
    if (testData && testData.currentQuestion) {
      console.log("=== DEBUG QUESTION DATA ===");
      const questionGroups = extractQuestionGroups();
      console.log("Question Groups:", questionGroups);

      const allQuestions = getAllQuestions();
      allQuestions?.forEach((question, index) => {
        const questionText = getSafeQuestionText(question);
        const groupType = findQuestionGroupType(index);
        console.log(`Question ${index}:`, {
          hasPlaceholders: hasPlaceholders(questionText),
          groupType: groupType,
          textPreview: questionText?.substring(0, 100)
        });
      });
      console.log("=== END DEBUG ===");
    }
  }, [testData]);

  // Update extract functions to use current question data
  const getCurrentQuestionData = () => {
    if (!testData) return null;

    if (testData.currentQuestion && typeof testData.currentQuestion === 'object') {
      return testData.currentQuestion;
    }

    if (testData.questions || testData.questionGroup || testData.content) {
      return testData;
    }

    return null;
  };

  // Extract questions from API response based on your structure
  const extractQuestions = () => {
    const currentQuestion = getCurrentQuestionData();
    if (!currentQuestion) return [];

    let questions = [];

    if (currentQuestion.questionGroup && Array.isArray(currentQuestion.questionGroup)) {
      questions = currentQuestion.questionGroup.flatMap(group => {
        if (group && Array.isArray(group.questions)) {
          return group.questions.filter(q => q && typeof q === 'object');
        }
        return [];
      });
    } else if (Array.isArray(currentQuestion.questions)) {
      questions = currentQuestion.questions.filter(q => q && typeof q === 'object');
    }

    return questions;
  };

  const extractContent = () => {
    const currentQuestion = getCurrentQuestionData();
    if (!currentQuestion) return "Loading content...";

    if (currentQuestion.content && typeof currentQuestion.content === 'object') {
      return currentQuestion.content.passageText || currentQuestion.content.text || JSON.stringify(currentQuestion.content);
    }

    if (typeof currentQuestion.content === 'string') {
      return currentQuestion.content;
    }

    return "Reading passage content will appear here";
  };

  const extractTitle = () => {
    const currentQuestion = getCurrentQuestionData();
    if (!currentQuestion) return "Test";

    if (currentQuestion.title && typeof currentQuestion.title === 'object') {
      return currentQuestion.title.text || currentQuestion.title.name || "IELTS Reading Test";
    }

    return currentQuestion.title || "IELTS Reading Test";
  };

  // Extract instruction from API response
  const extractInstruction = () => {
    const currentQuestion = getCurrentQuestionData();
    if (!currentQuestion) return "Answer the following questions.";

    if (currentQuestion.content?.instruction) {
      return currentQuestion.content.instruction;
    }

    return currentQuestion.instruction ||
      testData?.instruction ||
      testData?.data?.instruction ||
      "Read the passage and answer the questions below.";
  };

  // Extract question groups for navigation
  const extractQuestionGroups = () => {
    const currentQuestion = getCurrentQuestionData();
    if (!currentQuestion?.questionGroup) return [];

    return currentQuestion.questionGroup.map((group, index) => ({
      id: group?._id || index + 1,
      instruction: group?.instruction,
      questions: group?.questions || [],
      order: group?.order || index + 1,
      commonOptions: group?.commonOptions,
      type: group?.type
    })).filter(group => group);
  };

  // Get all questions (combining all groups)
  const getAllQuestions = () => {
    const questionGroups = extractQuestionGroups();
    if (questionGroups.length === 0) {
      return extractQuestions();
    }
    const allQuestions = questionGroups.flatMap(group => group?.questions || []);
    return allQuestions;
  };

  const calculateTotalQuestions = () => {
    const allQuestions = getAllQuestions();
    let total = 0;

    allQuestions?.forEach((question, index) => {
      const questionText = getSafeQuestionText(question);
      const groupType = findQuestionGroupType(index);

      if (hasPlaceholders(questionText)) {
        const placeholderCount = (questionText.match(/\{\{\d+\}\}/g) || []).length;
        total += placeholderCount;
      } else if (groupType === 'multiple_choice_multiple' &&
        (questionText?.includes('TWO') || questionText?.includes('10-11') || questionText?.includes('12-13'))) {
        total += 2;
      } else {
        total += 1;
      }
    });

    return total;
  };

  // Calculate starting number for each question
  const calculateQuestionStartingNumber = (questionIndex) => {
    const allQuestions = getAllQuestions();

    let startingNumber = 1;

    for (let i = 0; i < questionIndex; i++) {
      const prevQuestion = allQuestions?.[i];
      const prevQuestionText = getSafeQuestionText(prevQuestion);
      const groupType = findQuestionGroupType(i);

      if (hasPlaceholders(prevQuestionText)) {
        const placeholderCount = (prevQuestionText.match(/\{\{\d+\}\}/g) || []).length;
        startingNumber += placeholderCount;
      } else if (groupType === 'multiple_choice_multiple' &&
        (prevQuestionText?.includes('TWO') || prevQuestionText?.includes('10-11') || prevQuestionText?.includes('12-13'))) {
        startingNumber += 2;
      } else {
        startingNumber += 1;
      }
    }

    return startingNumber;
  };

  // Check if current test is a writing task
  const isWritingTask = () => {
    const currentQuestion = getCurrentQuestionData();
    if (!currentQuestion) return false;

    const questionType = currentQuestion.questionType;
    const questionCategory = currentQuestion.questionCategory;
    return questionType?.includes('writing') || questionCategory?.includes('writing');
  };

  // Navigation functions
  const goToNextQuestion = () => {
    const allQuestions = getAllQuestions();
    if (currentQuestionIndex < (allQuestions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

const goToPreviousQuestion = async () => {
  try {
    if (currentQuestionIndex <= 0) {
      console.log("ℹ️ Already at first question, cannot go back");
      return;
    }

    setIsSubmitting(true);
    console.log("🔄 Going to previous question from index:", currentQuestionIndex);

    // Step 1: Get current answers and submit them (as before)
    const currentAnswers = watch();
    console.log("📝 Current answers before going back:", currentAnswers);

    try {
      const formattedAnswers = formatAnswersForSubmission(currentAnswers);
      const submissionData = {
        answers: formattedAnswers,
        lastQuestionIndex: currentQuestionIndex,
        timeSpent: 60 * 60 - timeLeft,
        completed: false
      };
      console.log("💾 Saving answers before going back:", submissionData);

      // Submit current answers (required for backend to persist)
      await api.post(`/test/session/${sessionId}/submit`, submissionData);
    } catch (submitError) {
      console.log("⚠️ Could not save current answers, continuing:", submitError);
    }

    // Step 2: Call previous question API
    console.log("🔙 Calling previous question API...");
    const response = await api.get(`/test/session/${sessionId}/previous`);
    console.log("📥 Previous question API response:", response.data);

    if (response.data.success) {
      // Update test data with previous question data
      setTestData(prev => ({
        ...prev,
        ...response.data,
        currentQuestion: response.data.currentQuestion || response.data.data?.currentQuestion,
        progress: response.data.progress || response.data.data?.progress || prev.progress
      }));

      // Step 3: Extract saved answers from API response
      const savedAnswersArray = response.data.answers || []; // <-- This is your userAnswer array!
      console.log("🔍 Saved answers from API:", savedAnswersArray);

      // Step 4: Determine the previous question's ID
      const allQuestions = getAllQuestions();
      const previousQuestionIndex = currentQuestionIndex - 1;
      const previousQuestion = allQuestions[previousQuestionIndex];

      if (previousQuestion) {
        const questionId = previousQuestion._id || previousQuestion.id;

        // Step 5: Load the saved answer for this question
        const loadedAnswers = loadSavedAnswersForQuestion(questionId, savedAnswersArray);
        console.log("✅ Loaded saved answer for question", questionId, ":", loadedAnswers);

        // Step 6: Use setValue to pre-fill form fields (non-destructive, respects your UI)
        Object.keys(loadedAnswers).forEach(key => {
          setValue(key, loadedAnswers[key], { shouldValidate: false, shouldDirty: false });
        });

        // Step 7: Update current index
        const progress = response.data.progress || response.data.data?.progress;
        if (progress && progress.currentQuestion) {
          const newIndex = progress.currentQuestion - 1;
          setCurrentQuestionIndex(newIndex);
          console.log("✅ Updated to question index from API:", newIndex);
        } else {
          setCurrentQuestionIndex(previousQuestionIndex);
          console.log("🔄 Manual navigation to index:", previousQuestionIndex);
        }

        // Clear form values for other fields (optional, but clean)
        // We don't clear all — only the one we're navigating to gets pre-filled.
        // Other fields will retain their state if they were previously answered.
      }
    } else {
      throw new Error("API returned success: false");
    }

    // Clear form values for *other* fields? Not necessary — we only pre-fill the current one.
    // React Hook Form will keep values for fields not touched — this is fine.

  } catch (err) {
    console.error("🔥 Error in goToPreviousQuestion:", err);
    // Final fallback - manual navigation (no answer loading)
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
      console.log("🔄 Fallback navigation to index:", newIndex);
    }
  } finally {
    setIsSubmitting(false);
  }
};

  // Full-screen gaming security setup
  useEffect(() => {
    const applyFullScreenStyles = () => {
      document.documentElement.style.cssText = `
        overflow: hidden !important;
        width: 100vw !important;
        height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
      `;

      document.body.style.cssText = `
        overflow: hidden !important;
        width: 100vw !important;
        height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
      `;
    };

    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    applyFullScreenStyles();
    document.addEventListener('contextmenu', preventContextMenu);

    const interval = setInterval(applyFullScreenStyles, 1000);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      clearInterval(interval);
      document.documentElement.style.cssText = '';
      document.body.style.cssText = '';
    };
  }, []);


  const handleFinalSubmission = useCallback(async (formData = null) => {
  try {
    setIsSubmitting(true);
    const answers = formData || watch();
    const formattedAnswers = formatAnswersForSubmission(answers);
    const timeSpent = 60 * 60 - timeLeft;

    const submissionData = {
      answers: formattedAnswers,
      timeSpent: timeSpent,
      lastQuestionIndex: currentQuestionIndex,
      completed: true
    };

    console.log("💾 Saving to localStorage - Final submission:", submissionData);

    // Save to localStorage instead of API
    try {
      // Create a unique key for this test session
      const storageKey = `test_submission_${sessionId}_${Date.now()}`;
      
      // Save the submission data to localStorage
      localStorage.setItem(storageKey, JSON.stringify({
        ...submissionData,
        savedAt: new Date().toISOString(),
        testId: testId,
        sessionId: sessionId
      }));

      console.log("✅ Successfully saved to localStorage with key:", storageKey);
      
      // Also save to a recent submissions list
      const recentSubmissions = JSON.parse(localStorage.getItem('recent_test_submissions') || '[]');
      recentSubmissions.unshift({
        key: storageKey,
        testId: testId,
        sessionId: sessionId,
        savedAt: new Date().toISOString(),
        timeSpent: timeSpent,
        answersCount: formattedAnswers.length
      });
      
      // Keep only last 10 submissions
      localStorage.setItem('recent_test_submissions', JSON.stringify(recentSubmissions.slice(0, 10)));
      
    } catch (storageError) {
      console.error("❌ Error saving to localStorage:", storageError);
      throw new Error("Failed to save answers locally");
    }

    // Show success message
    alert("Test completed! All answers have been saved locally.");
    
    // Navigate back
    window.history.back();
    
  } catch (err) {
    console.error("❌ Final submission error:", err);
    alert("Test completed! Answers: " + JSON.stringify(formData || watch(), null, 2));
    window.history.back();
  } finally {
    setIsSubmitting(false);
  }
}, [timeLeft, currentQuestionIndex, sessionId, testId]);

  // // // Timer effect
  // const handleFinalSubmission = useCallback(async (formData = null) => {

  // }, [timeLeft, currentQuestionIndex, sessionId]);

  // // Timer effect with stable dependencies
  // useEffect(() => {
  //   if (timeLeft <= 0) {
  //     handleFinalSubmission();
  //     return;
  //   }

  //   const timer = setInterval(() => {
  //     setTimeLeft(prev => prev - 1);
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, []);



  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const onSubmit = async (data) => {
    await handleFinalSubmission(data);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Watch writing answer for word count
  const progress = getProgressInfo();
  const writingAnswer = watch(`writing_${progress.current}`);
  useEffect(() => {
    if (isWritingTask() && writingAnswer) {
      setWordCount(calculateWordCount(writingAnswer));
    }
  }, [writingAnswer, progress.current]);

  // Get data from API response
  const questionGroups = extractQuestionGroups();
  const allQuestions = getAllQuestions();
  const content = extractContent();
  const title = extractTitle();
  const instruction = extractInstruction();
  const totalQuestionsCount = calculateTotalQuestions();
  const isWriting = isWritingTask();
  const isLastQuestion = progress.current === progress.total;

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black text-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl">Loading test questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black text-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Error Loading Test</h2>
          <p className="text-gray-400 mb-2">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Writing Task Layout
  if (isWriting) {
    const currentQuestion = getCurrentQuestionData();
    const questionId = `writing_${progress.current}`;

    return (
      <div className="fixed inset-0 bg-gray-900 text-white z-50 overflow-hidden">
        {/* Top Navigation Bar */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">{title}</h1>
              <span className="text-gray-400">
                {/* Question {progress.current} of {progress.total} */}
              </span>
            </div>

            <div className="flex items-center space-x-6">
              <div className={`px-3 py-1 rounded-lg ${wordCount < 150 ? 'bg-yellow-600' : 'bg-green-600'} text-white`}>
                Words: {wordCount}/150
              </div>

              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-700 text-white hover:opacity-80 transition-all"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              <div className={`text-lg font-mono px-3 py-1 rounded-lg ${timeLeft < 300 ? 'bg-red-600 animate-pulse' : 'bg-blue-600'} text-white`}>
                {formatTime(timeLeft)}
              </div>

              {isLastQuestion ? (
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-medium transition-all duration-200 text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Test"}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-all duration-200 text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Loading..." : "Next Question"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Writing Layout */}
        <div className="flex w-full" style={{ height: 'calc(100vh - 80px)' }}>
          {/* Left Side - Question and Instructions (40%) */}
          <div className="w-2/5 bg-gray-800 p-6 overflow-y-auto">
            <div className="bg-gray-700 rounded-lg p-6 h-full">
              <h2 className="text-xl font-semibold text-white mb-4">
                {/* Question {progress.current} */}
              </h2>

              {/* Instruction */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Instructions:</h3>
                <div className="bg-gray-600 rounded-lg p-4">
                  <p className="text-gray-200 leading-relaxed text-lg whitespace-pre-line">
                    {instruction}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-white mb-3">Task Content:</h3>
                <div className="bg-gray-600 rounded-lg p-4">
                  {currentQuestion?.content?.imageUrl && (
                    <img
                      src={currentQuestion.content.imageUrl}
                      alt="Writing task diagram"
                      className="max-w-full max-h-96 mx-auto rounded-lg mb-4"
                    />
                  )}
                  <div
                    className="prose prose-invert max-w-none text-gray-200 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Writing Area (60%) */}
          <div className="w-3/5 bg-gray-900 p-6 overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-800 rounded-lg p-6 h-full flex flex-col">
              <h2 className="text-xl font-semibold text-white mb-4">
                {/* Your Answer - Question {progress.current} */}
              </h2>

              {/* Word Count Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Word Count: {wordCount}</span>
                  <span>Minimum: 150</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${wordCount < 75 ? 'bg-red-500' :
                      wordCount < 150 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                    style={{ width: `${Math.min((wordCount / 150) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Writing Textarea */}
              <textarea
                {...register(questionId)}
                placeholder="Start writing your answer here..."
                className="flex-1 w-full px-4 py-3 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white resize-none font-mono text-lg leading-relaxed"
                style={{ minHeight: '400px' }}
              />

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6 pt-6 border-t border-gray-700">
                {/* Previous Button - Show from second question onwards */}
                {currentQuestion > 1 ? (
                  <button
                    type="button"
                    onClick={goToPreviousQuestion}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
                  >
                    Previous Question
                  </button>
                ) : (
                  <div></div>
                )}

                {/* Next/Submit Button */}
                {isLastQuestion ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Test"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
                  >
                    {isSubmitting ? "Loading..." : "Next Question"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Reading Task Layout
  return (
    <div className="fixed inset-0 bg-gray-900 text-white z-50 overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">{title}</h1>
            <span className="text-gray-400">
              {/* Question {progress.current} of {progress.total} - Questions 1-{totalQuestionsCount} */}
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-700 text-white hover:opacity-80 transition-all"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            <div className={`text-lg font-mono px-3 py-1 rounded-lg ${timeLeft < 300 ? 'bg-red-600 animate-pulse' : 'bg-blue-600'} text-white`}>
              {formatTime(timeLeft)}
            </div>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-medium transition-all duration-200 text-white disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Test"}
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-all duration-200 text-white disabled:opacity-50"
              >
                {isSubmitting ? "Loading..." : "Next Question"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Full Width Reading Layout */}
      <div className="flex w-full" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Left Side - Reading Passage (50%) */}
        <div className="w-1/2 bg-gray-800 p-6 overflow-y-auto">
          <div className="bg-gray-700 rounded-lg p-6 h-full">
            <h2 className="text-xl font-semibold text-white mb-4">Reading Passage</h2>
            <div
              className="prose prose-invert max-w-none text-gray-200 leading-relaxed text-lg"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>

        {/* Right Side - Questions (50%) */}
        <div className="w-1/2 bg-gray-900 p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Questions 1-{totalQuestionsCount}</h2>
            <p className="text-gray-400 mb-6 text-lg whitespace-pre-line">{instruction}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {allQuestions?.map((question, index) => {
              if (question?.isQuestionGroup) {
                console.error("❌ Found a question group in allQuestions! Index:", index, question);
                return null;
              }
              if (typeof question !== 'object' || !question) {
                console.warn("⚠️ Invalid question", index, question);
                return null;
              }

              const questionId = question?._id || question?.id || `q-${index}`;
              const questionText = getSafeQuestionText(question);
              const startingNumber = calculateQuestionStartingNumber(index);
              const hasPlaceholdersFlag = hasPlaceholders(questionText);
              const groupType = findQuestionGroupType(index);

              let displayNumber;
              let showQuestionNumber = true;

              if (hasPlaceholdersFlag) {
                showQuestionNumber = false;
                displayNumber = startingNumber;
              } else if (groupType === 'multiple_choice_multiple' &&
                (questionText?.includes('TWO') || questionText?.includes('10-11') || questionText?.includes('12-13'))) {
                displayNumber = `${startingNumber}-${startingNumber + 1}`;
              } else {
                displayNumber = startingNumber.toString();
              }

              return (
                <div key={questionId} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-start space-x-4">
                    {showQuestionNumber && (
                      <span className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-medium">
                        {displayNumber}
                      </span>
                    )}

                    {!showQuestionNumber && (
                      <span className="flex-shrink-0 w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-lg font-medium opacity-0">
                        {index + 1}
                      </span>
                    )}

                    <SafeQuestionRenderer
                      question={question}
                      questionId={questionId}
                      index={index}
                      groupType={groupType}
                    />
                  </div>
                </div>
              );
            })}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6 pt-6 border-t border-gray-700">
              {/* Previous Button - Show from second question onwards */}
              {currentQuestionIndex > 0 ? (
                <button
                  type="button"
                  onClick={goToPreviousQuestion}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? "Loading..." : "Previous Question"}
                </button>
              ) : (
                <div></div>
              )}

              {/* Next/Submit Button */}
              {isLastQuestion ? (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Test"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? "Loading..." : "Next Question"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TestQuestionPage;