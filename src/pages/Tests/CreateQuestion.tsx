import { useState, useEffect } from 'react';
import Input from '../../components/form/input/InputField';
import Label from '../../components/form/Label';
import { toast } from 'react-toastify';
import api from '../../axiosInstance';
import RichTextEditor from '../../components/TextEditor';

const EXAM_TYPES = [
  { value: 'ielts', label: 'IELTS' },
  { value: 'toefl', label: 'TOEFL' },
  { value: 'pte', label: 'PTE' },
  { value: 'gre', label: 'GRE' },
  { value: 'gmat', label: 'GMAT' },
  { value: 'sat', label: 'SAT' },
  { value: 'duolingo', label: 'Duolingo' },
  { value: 'other', label: 'Other' },
];

const MAIN_SECTIONS = {
  ielts: [
    { value: 'listening', label: 'Listening' },
    { value: 'reading', label: 'Reading' },
    { value: 'writing', label: 'Writing' },
    { value: 'speaking', label: 'Speaking' },
  ],
  toefl: [
    { value: 'listening', label: 'Listening' },
    { value: 'reading', label: 'Reading' },
    { value: 'speaking', label: 'Speaking' },
    { value: 'writing', label: 'Writing' },
  ],
  pte: [
    { value: 'listening', label: 'Listening' },
    { value: 'reading', label: 'Reading' },
    { value: 'writing', label: 'Writing' },
    { value: 'speaking', label: 'Speaking' },
  ],
  gre: [
    { value: 'verbal', label: 'Verbal Reasoning' },
    { value: 'quant', label: 'Quantitative Reasoning' },
    { value: 'awa', label: 'Analytical Writing' },
  ],
  gmat: [
    { value: 'verbal', label: 'Verbal' },
    { value: 'quant', label: 'Quantitative' },
    { value: 'ir', label: 'Integrated Reasoning' },
    { value: 'awa', label: 'Analytical Writing' },
  ],
  sat: [
    { value: 'reading', label: 'Reading' },
    { value: 'writing', label: 'Writing & Language' },
    { value: 'math', label: 'Math' },
    { value: 'essay', label: 'Essay (Optional)' },
  ],
  duolingo: [
    { value: 'listening', label: 'Listening' },
    { value: 'reading', label: 'Reading' },
    { value: 'speaking', label: 'Speaking' },
    { value: 'writing', label: 'Writing' },
    { value: 'production', label: 'Production' },
    { value: 'completion', label: 'Completion' },
  ],
  other: [
    { value: 'listening', label: 'Listening' },
    { value: 'reading', label: 'Reading' },
    { value: 'writing', label: 'Writing' },
    { value: 'speaking', label: 'Speaking' },
    { value: 'quant', label: 'Quantitative' },
    { value: 'verbal', label: 'Verbal' },
    { value: 'other', label: 'Other' },
  ],
};

const QUESTION_SUBTYPES = {
  ielts: {
    listening: [
      'form_completion', 'note_completion', 'table_completion', 'flow_chart_completion',
      'summary_completion', 'sentence_completion', 'short_answer', 'map_labelling',
      'plan_labelling', 'diagram_labelling', 'multiple_choice_single', 'multiple_choice_multiple',
      'matching', 'pick_from_a_list', 'classification'
    ],
    reading: [
      'multiple_choice_single', 'multiple_choice_multiple', 'true_false_not_given', 'yes_no_not_given',
      'matching_headings', 'matching_information', 'matching_features', 'sentence_completion',
      'summary_completion', 'note_completion', 'table_completion', 'flow_chart_completion',
      'diagram_labelling', 'short_answer', 'matching_sentence_endings', 'classification_reading'
    ],
    writing: ['writing_task_1_academic', 'writing_task_1_general', 'writing_task_2'],
    speaking: ['speaking_part_1', 'speaking_part_2', 'speaking_part_3'],
  },
  toefl: {
    listening: ['multiple_choice_single', 'multiple_choice_multiple', 'ordering', 'matching'],
    reading: ['multiple_choice_single', 'insert_sentence', 'summary', 'vocabulary', 'reference'],
    speaking: ['independent_task', 'integrated_task'],
    writing: ['integrated_writing', 'independent_writing'],
  },
  pte: {
    listening: ['highlight_correct_summary', 'multiple_choice_single', 'multiple_choice_multiple', 'fill_blanks', 'select_missing_word', 'highlight_incorrect_words', 'write_from_dictation'],
    reading: ['multiple_choice_single', 'multiple_choice_multiple', 'reorder_paragraphs', 'fill_blanks', 'reading_writing_fill_blanks'],
    writing: ['summarize_written_text', 'essay'],
    speaking: ['read_aloud', 'repeat_sentence', 'describe_image', 're_tell_lecture', 'answer_short_question'],
  },
  gre: {
    verbal: ['text_completion', 'sentence_equivalence', 'reading_comprehension'],
    quant: ['quantitative_comparison', 'multiple_choice_single', 'multiple_choice_multiple', 'numeric_entry'],
    awa: ['issue_task', 'argument_task'],
  },
  gmat: {
    verbal: ['critical_reasoning', 'reading_comprehension', 'sentence_correction'],
    quant: ['data_sufficiency', 'problem_solving'],
    ir: ['table_analysis', 'graphics_interpretation', 'multi_source_reasoning', 'two_part_analysis'],
    awa: ['analysis_of_an_argument'],
  },
  sat: {
    reading: ['evidence_support', 'vocabulary_in_context', 'main_idea', 'inference'],
    writing: ['grammar', 'sentence_structure', 'punctuation', 'organization'],
    math: ['heart_of_algebra', 'problem_solving_data_analysis', 'passport_to_advanced_math', 'additional_topics'],
    essay: ['reading_analysis_writing'],
  },
  duolingo: {
    listening: ['listen_and_type', 'listen_and_speak'],
    reading: ['read_and_complete', 'read_and_answer'],
    speaking: ['speak_on_topic', 'read_and_speak'],
    writing: ['write_on_topic', 'complete_the_sentence'],
    production: ['speak_on_image', 'write_on_image'],
    completion: ['fill_blanks', 'highlight_text'],
  },
  other: {
    listening: ['audio_based_q'],
    reading: ['passage_based_q'],
    writing: ['free_response'],
    speaking: ['recorded_response'],
    quant: ['math_problem'],
    verbal: ['verbal_q'],
    other: ['custom'],
  }
};

const formatLabel = (str) => {
  return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const isListening = (mainType) => ['listening', 'production'].includes(mainType);
const isReading = (mainType) => mainType === 'reading';
const isWriting = (mainType) => ['writing', 'awa', 'essay'].includes(mainType);
const isSpeaking = (mainType) => ['speaking', 'production'].includes(mainType);
const isQuant = (mainType) => ['quant', 'math', 'ir'].includes(mainType);
const needsOptions = (type) => [
  'multiple_choice_single', 'multiple_choice_multiple', 'matching', 'matching_headings',
  'matching_information', 'matching_features', 'matching_sentence_endings', 'classification',
  'classification_reading', 'pick_from_a_list'
].includes(type);
const needsCompletion = (type) => [
  'form_completion', 'note_completion', 'table_completion', 'flow_chart_completion',
  'summary_completion', 'sentence_completion', 'fill_blanks', 'write_from_dictation'
].includes(type);

export default function QuestionForm({
  examId: initialExamId = '',
  sectionId: initialSectionId = '',
  initialData = null,
  onClose,
  onSuccess,
}) {
  const isEditing = !!initialData;
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    examType: '',
    sectionId: initialSectionId,
    mainType: '',
    isQuestionGroup: false,
    questionType: '',
    marks: 1,
    difficulty: 'medium',
    content: {
      instruction: '',
      passageTitle: '',
      passageText: '',
      transcript: '',
      imageUrl: '',
      audioUrl: '',
      videoUrl: '',
    },
    cueCard: { topic: '', prompts: [''] },
    options: [{ label: '', text: '', isCorrect: false, explanation: '' }],
    sampleAnswer: { text: '', wordCount: 0, bandScore: 0 },
    explanation: '',
    tags: [''],
    timeLimit: 0,
    isActive: true,
    questionGroup: [
      {
        title: '',
        instruction: '',
        order: 1,
        type: '',
        marks: 1,
        questions: [
          { question: '', options: [{ label: '', text: '', isCorrect: false }], correctAnswer: '' }
        ]
      }
    ]
  });
  const [errors, setErrors] = useState({});
  const [allSections, setAllSections] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev, mainType: initialData.questionCategory,
        examType: initialData.exam, ...initialData
      }));
    }
  }, [initialData]);

  // Fetch exams/sections
  useEffect(() => {
    if (initialExamId && initialSectionId) return;
    const fetchRelated = async () => {
      try {
        const [sectionsRes] = await Promise.all([
          api.get('/test/sections'),
        ]);
        setAllSections(sectionsRes.data?.data || []);
      } catch (err) {
        toast.error('Failed to load exams/sections');
      }
    };
    fetchRelated();
  }, [initialExamId, initialSectionId]);

  // Toggle dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);

  // ======================
  // HANDLERS
  // ======================
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    if (name.startsWith('content.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({ ...prev, content: { ...prev.content, [field]: value } }));
    } else if (name.startsWith('sampleAnswer.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({ ...prev, sampleAnswer: { ...prev.sampleAnswer, [field]: value } }));
    } else if (name === 'isActive' || name === 'isQuestionGroup') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'examType') {
      setFormData(prev => ({
        ...prev,
        examType: value,
        mainType: '',
        questionType: '',
        options: [{ label: '', text: '', isCorrect: false, explanation: '' }],
      }));
    } else if (name === 'mainType') {
      setFormData(prev => ({
        ...prev,
        mainType: value,
        questionType: '',
        options: [{ label: '', text: '', isCorrect: false, explanation: '' }],
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // ==== Group handlers ====
  const updateGroupField = (gIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      questionGroup: prev.questionGroup.map((g, i) => i === gIndex ? { ...g, [field]: value } : g)
    }));
  };

  const updateGroupQuestion = (gIndex, qIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      questionGroup: prev.questionGroup.map((g, i) =>
        i === gIndex ? { ...g, questions: g.questions.map((q, j) => j === qIndex ? { ...q, [field]: value } : q) } : g
      )
    }));
  };

  const updateGroupQuestionOption = (gIndex, qIndex, oIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      questionGroup: prev.questionGroup.map((g, i) =>
        i === gIndex ? {
          ...g,
          questions: g.questions.map((q, j) =>
            j === qIndex ? { ...q, options: q.options.map((opt, k) => k === oIndex ? { ...opt, [field]: value } : opt) } : q
          )
        } : g
      )
    }));
  };

  const addQuestionToGroup = (gIndex) => {
    setFormData(prev => ({
      ...prev,
      questionGroup: prev.questionGroup.map((g, i) =>
        i === gIndex ? { ...g, questions: [...g.questions, { question: '', options: [{ label: '', text: '', isCorrect: false }], correctAnswer: '' }] } : g
      )
    }));
  };

  const addOptionToGroupQuestion = (gIndex, qIndex) => {
    setFormData(prev => ({
      ...prev,
      questionGroup: prev.questionGroup.map((g, i) =>
        i === gIndex ? { ...g, questions: g.questions.map((q, j) => j === qIndex ? { ...q, options: [...q.options, { label: '', text: '', isCorrect: false }] } : q) } : g
      )
    }));
  };

  const addGroup = () => {
    setFormData(prev => ({
      ...prev,
      questionGroup: [...prev.questionGroup, {
        title: '', instruction: '', order: prev.questionGroup.length + 1, type: '',
        marks: 1, questions: [{ question: '', options: [{ label: '', text: '', isCorrect: false }], correctAnswer: '' }]
      }]
    }));
  };

  const removeGroup = (gIndex) => {
    setFormData(prev => ({ ...prev, questionGroup: prev.questionGroup.filter((_, i) => i !== gIndex) }));
  };

  const updateArrayField = (index, field, value, arrayName) => {
    setFormData(prev => ({ ...prev, [arrayName]: prev[arrayName].map((item, i) => i === index ? { ...item, [field]: value } : item) }));
  };

  const addArrayItem = (arrayName, template) => {
    setFormData(prev => ({ ...prev, [arrayName]: [...prev[arrayName], template] }));
  };

  const removeArrayItem = (index, arrayName) => {
    setFormData(prev => ({ ...prev, [arrayName]: prev[arrayName].filter((_, i) => i !== index) }));
  };

  // ======================
  // VALIDATION PER STEP
  // ======================
  const validateStep = (stepNum) => {
    const newErrors = {};
    if (stepNum === 1) {
      if (!formData.examType) newErrors.examType = 'Exam type is required';
      if (!formData.mainType) newErrors.mainType = 'Section type is required';
      if (!initialSectionId && !formData.sectionId) newErrors.sectionId = 'Section is required';
    } else if (stepNum === 2) {
      if (!formData.isQuestionGroup) {
        if (!formData.questionType) newErrors.questionType = 'Question type is required';
        if (!formData.content.instruction?.trim()) newErrors.instruction = 'Instruction is required';
        if (isReading(formData.mainType) && !formData.content.passageText?.trim()) {
          newErrors.passageText = 'Reading passage is required';
        }
      } else {
        formData.questionGroup.forEach((group, gIndex) => {
          if (!group.title?.trim()) newErrors[`group_${gIndex}_title`] = 'Group title is required';
          if (!group.instruction?.trim()) newErrors[`group_${gIndex}_instruction`] = 'Group instruction is required';
          if (!group.type) newErrors[`group_${gIndex}_type`] = 'Group question type is required';
          if (isReading(formData.mainType) && !formData.content.passageText?.trim()) {
            newErrors.passageText = 'Reading passage is required';
          }
          if (isListening(formData.mainType) && !formData.content.audioUrl?.trim()) {
            newErrors.audioUrl = 'Audio URL is required for Listening';
          }
          group.questions.forEach((q, qIndex) => {
            if (!q.question?.trim()) newErrors[`group_${gIndex}_q_${qIndex}`] = 'Question text is required';
          });
        });
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => validateStep(step) && setStep(p => Math.min(p + 1, 3));
  const prevStep = () => setStep(p => Math.max(p - 1, 1));

  // ======================
  // SUBMIT
  // ======================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(2)) return;
    const payload = {
      title: formData.title,
      exam: formData.examType,
      questionCategory: formData.mainType,
      sectionId: formData.sectionId,
      isQuestionGroup: formData.isQuestionGroup,
      marks: formData.marks,
      difficulty: formData.difficulty,
      tags: formData.tags.filter(t => t.trim()),
      timeLimit: formData.timeLimit,
      isActive: formData.isActive,
      content: formData.content,
      totalQuestions: formData.totalQuestions
    };
    if (!formData.isQuestionGroup) {
      payload.questionType = formData.questionType;
      payload.cueCard = formData.cueCard;
      payload.options = formData.options;
      payload.correctAnswer = formData.correctAnswer;
      payload.explanation = formData.explanation;
      payload.sampleAnswer = formData.sampleAnswer;
    } else {
      payload.questionGroup = formData.questionGroup.map((group, idx) => ({
        title: group.title,
        instruction: group.instruction,
        order: group.order,
        type: group.type,
        marks: group.marks,
        commonOptions: group.commonOptions,
        questions: group.questions.map(q => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
        })),
      }));
    }
    try {
      if (isEditing) {
        await api.put(`/test/questions/${initialData._id}`, payload);
        toast.success('Question updated!');
      } else {
        await api.post('/test/questions', payload);
        toast.success('Question created!');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Operation failed');
    }
  };

  const availableMainSections = MAIN_SECTIONS[formData.examType] || [];
  const availableQuestionTypes = QUESTION_SUBTYPES[formData.examType]?.[formData.mainType] || [];
  const showPassage = isReading(formData.mainType);
  const showAudio = isListening(formData.mainType);
  const showCueCard = formData.questionType === 'speaking_part_2';
  const showSampleAnswer = isWriting(formData.mainType);
  const showOptions = !formData.isQuestionGroup && needsOptions(formData.questionType);
  const showCompletion = !formData.isQuestionGroup && needsCompletion(formData.questionType);

  // ======================
  // RENDER STEPS
  // ======================
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            {/* Toggle Dark Mode */}
            <div className="flex justify-end">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-300"
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                    Light Mode
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                    </svg>
                    Dark Mode
                  </>
                )}
              </button>
            </div>

            {/* Question Group Toggle */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl border border-blue-100 dark:border-blue-800/50">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  id="isQuestionGroup"
                  checked={formData.isQuestionGroup}
                  onChange={(e) => handleChange({ target: { name: 'isQuestionGroup', checked: e.target.checked } })}
                  className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <div>
                  <Label htmlFor="isQuestionGroup" className="font-semibold text-gray-800 dark:text-gray-200">
                    Create as Question Group?
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Use this option for blocks like "Questions 1–5" where multiple questions share the same passage or audio.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Title */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</Label>
                <div className="relative">
                  <Input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter a descriptive title for your question"
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>{errors.title}</p>}
                </div>
              </div>

              {/* Exam Type */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Exam Type *</Label>
                <div className="relative">
                  <select
                    name="examType"
                    value={formData.examType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
                  >
                    <option value="">Select an exam</option>
                    {EXAM_TYPES.map(e => (
                      <option key={e.value} value={e.value} className="bg-white dark:bg-gray-800">
                        {e.label}
                      </option>
                    ))}
                  </select>
                  {errors.examType && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>{errors.examType}</p>}
                </div>
              </div>
            </div>

            {/* Section Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {!initialSectionId && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section *</Label>
                  <div className="relative">
                    <select
                      name="sectionId"
                      value={formData.sectionId}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
                    >
                      <option value="">Select a section</option>
                      {allSections.map(s => (
                        <option key={s._id} value={s._id} className="bg-white dark:bg-gray-800">
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {errors.sectionId && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>{errors.sectionId}</p>}
                  </div>
                </div>
              )}

              {/* Section Type */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section Type *</Label>
                <div className="relative">
                  <select
                    name="mainType"
                    value={formData.mainType}
                    onChange={handleChange}
                    disabled={!formData.examType}
                    className={`w-full px-4 py-2 rounded-xl border ${!formData.examType ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'} appearance-none`}
                  >
                    <option value="">Select a section type</option>
                    {availableMainSections.map(s => (
                      <option key={s.value} value={s.value} className="bg-white dark:bg-gray-800">
                        {s.label}
                      </option>
                    ))}
                  </select>
                  {errors.mainType && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>{errors.mainType}</p>}
                </div>
              </div>
            </div>

            {/* Exam Type Icon Preview */}
            {formData.examType && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg shadow-md">
                  {formData.examType.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected: {EXAM_TYPES.find(e => e.value === formData.examType)?.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Choose a section type to continue</p>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">

            {/* Main Fields Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">Basic Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {!formData.isQuestionGroup && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Question Type *</Label>
                    <div className="relative">
                      <select
                        name="questionType"
                        value={formData.questionType}
                        onChange={handleChange}
                        disabled={!formData.mainType || formData.isQuestionGroup}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
                      >
                        <option value="">Select question type</option>
                        {availableQuestionTypes.map(t => (
                          <option key={t} value={t} className="bg-white dark:bg-gray-800">
                            {formatLabel(t)}
                          </option>
                        ))}
                      </select>
                      {errors.questionType && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>{errors.questionType}</p>}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Marks</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      name="marks"
                      value={formData.marks}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</Label>
                  <div className="relative">
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Instruction */}
              <div className="mb-6">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instruction *</Label>
                <div className="relative">
                  <textarea
                    name="content.instruction"
                    value={formData.content.instruction}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="e.g., Complete the form. Write ONE WORD ONLY."
                  />
                  {errors.instruction && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>{errors.instruction}</p>}
                </div>
              </div>
            </div>

            {/* Conditional: Passage */}
            {showPassage && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">Reading Passage</h3>

                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Passage Title</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Enter a title for the passage"
                      value={formData.content.passageTitle}
                      onChange={(e) => handleChange({ target: { name: 'content.passageTitle', value: e.target.value } })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Passage Content *</Label>
                  <div className="relative">
                    <RichTextEditor
                      initialValue={formData.content.passageText}
                      onChange={(e) => handleChange({ target: { name: 'content.passageText', value: e } })}
                      className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    {errors.passageText && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>{errors.passageText}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Image URL */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">Media</h3>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image URL</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      name="content.imageUrl"
                      value={formData.content.imageUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    {errors.imageUrl && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>{errors.imageUrl}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Conditional: Options */}
            {showOptions && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">Answer Options</h3>

                <p className="text-gray-600 dark:text-gray-300 mb-4">Define the answer choices. Mark the correct one with the checkbox.</p>

                {formData.options.map((opt, idx) => (
                  <div key={idx} className="flex gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label</Label>
                      <Input
                        placeholder="A, B, C, etc."
                        value={opt.label}
                        onChange={(e) => updateArrayField(idx, 'label', e.target.value, 'options')}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Option Text</Label>
                      <Input
                        placeholder="The text of this option"
                        value={opt.text}
                        onChange={(e) => updateArrayField(idx, 'text', e.target.value, 'options')}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={opt.isCorrect}
                          onChange={(e) => updateArrayField(idx, 'isCorrect', e.target.checked, 'options')}
                          className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Correct</span>
                      </label>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addArrayItem('options', { label: '', text: '', isCorrect: false, explanation: '' })}
                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Add Option
                </button>
              </div>
            )}

            {/* Conditional: Completion Blanks */}
            {showCompletion && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">Correct Answers</h3>

                <p className="text-gray-600 dark:text-gray-300 mb-4">Enter the correct answer for each blank in the question.</p>

                {formData.options.map((opt, idx) => (
                  <div key={idx} className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Answer {idx + 1}</Label>
                      <Input
                        placeholder={`Answer for blank ${idx + 1}`}
                        value={opt.text}
                        onChange={(e) => updateArrayField(idx, 'text', e.target.value, 'options')}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      />
                    </div>
                    {formData.options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem(idx, 'options')}
                        className="flex items-center justify-center w-10 h-10 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200 rounded-lg border border-red-200 dark:border-red-800/30 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addArrayItem('options', { label: '', text: '', isCorrect: false, explanation: '' })}
                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Add Answer Blank
                </button>
              </div>
            )}

            {/* Conditional: Cue Card */}
            {showCueCard && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">Speaking Cue Card</h3>

                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Topic</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Enter the topic for the speaking cue card"
                      value={formData.cueCard.topic}
                      onChange={(e) => setFormData(p => ({ ...p, cueCard: { ...p.cueCard, topic: e.target.value } }))}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prompts</Label>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">These prompts guide the test taker during their speaking response.</p>

                  {formData.cueCard.prompts.map((prompt, idx) => (
                    <div key={idx} className="flex gap-4 mb-4">
                      <div className="flex-1">
                        <Input
                          placeholder="Enter a prompt"
                          value={prompt}
                          onChange={(e) => {
                            const prompts = [...formData.cueCard.prompts];
                            prompts[idx] = e.target.value;
                            setFormData(p => ({ ...p, cueCard: { ...p.cueCard, prompts } }));
                          }}
                          className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      {formData.cueCard.prompts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const prompts = formData.cueCard.prompts.filter((_, i) => i !== idx);
                            setFormData(p => ({ ...p, cueCard: { ...p.cueCard, prompts } }));
                          }}
                          className="flex items-center justify-center w-10 h-10 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200 rounded-lg border border-red-200 dark:border-red-800/30 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, cueCard: { ...p.cueCard, prompts: [...p.cueCard.prompts, ''] } }))}
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add Prompt
                  </button>
                </div>
              </div>
            )}

            {/* Conditional: Sample Answer */}
            {showSampleAnswer && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">Sample Answer</h3>

                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sample Answer Text</Label>
                  <div className="relative">
                    <textarea
                      name="sampleAnswer.text"
                      value={formData.sampleAnswer.text}
                      onChange={handleChange}
                      rows={6}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Enter a sample answer that would score well..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Word Count</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        name="sampleAnswer.wordCount"
                        value={formData.sampleAnswer.wordCount}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Score (Band Score)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        name="sampleAnswer.bandScore"
                        value={formData.sampleAnswer.bandScore}
                        onChange={handleChange}
                        step="0.5"
                        min="0"
                        max="9"
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GROUP MODE */}
            {formData.isQuestionGroup && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Question Groups</h3>
                  <button
                    type="button"
                    onClick={addGroup}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors duration-200 shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add Group
                  </button>
                </div>

                {formData.questionGroup.map((group, gIndex) => (
                  <div key={gIndex} className="mb-6 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-lg font-medium text-gray-800 dark:text-white">Group {gIndex + 1}</h4>
                      {formData.questionGroup.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeGroup(gIndex)}
                          className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</Label>
                        <div className="relative">
                          <Input
                            value={group.title}
                            onChange={(e) => updateGroupField(gIndex, 'title', e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                          {errors[`group_${gIndex}_title`] && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>{errors[`group_${gIndex}_title`]}</p>}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Question Type *</Label>
                        <div className="relative">
                          <select
                            value={group.type}
                            onChange={(e) => updateGroupField(gIndex, 'type', e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
                          >
                            <option value="">Select question type</option>
                            {availableQuestionTypes.map(t => (
                              <option key={t} value={t} className="bg-white dark:bg-gray-800">
                                {formatLabel(t)}
                              </option>
                            ))}
                          </select>
                          {errors[`group_${gIndex}_type`] && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>{errors[`group_${gIndex}_type`]}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instruction *</Label>
                      <div className="relative">
                        <textarea
                          value={group.instruction}
                          onChange={(e) => updateGroupField(gIndex, 'instruction', e.target.value)}
                          rows={4}
                          className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                        />
                        {errors[`group_${gIndex}_instruction`] && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>{errors[`group_${gIndex}_instruction`]}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Marks per question *</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={group.marks}
                            onChange={(e) => updateGroupField(gIndex, 'marks', e.target.value)}
                            min="0"
                            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Common Options</Label>
                        <div className="relative">
                          <Input
                            value={group.commonOptions}
                            onChange={(e) => updateGroupField(gIndex, 'commonOptions', e.target.value)}
                            placeholder="Optional: Define common options for all questions in this group"
                            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Questions</Label>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">Add questions that belong to this group.</p>

                      {group.questions.map((q, qIndex) => (
                        <div key={qIndex} className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="font-medium text-gray-800 dark:text-white">Question {qIndex + 1}</h5>
                            {group.questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedQuestions = [...group.questions];
                                  updatedQuestions.splice(qIndex, 1);
                                  updateGroupField(gIndex, 'questions', updatedQuestions);
                                }}
                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="mb-4">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question Stem</Label>
                            <Input
                              placeholder="Enter the question text"
                              value={q.question}
                              onChange={(e) => updateGroupQuestion(gIndex, qIndex, 'question', e.target.value)}
                              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                            {errors[`group_${gIndex}_q_${qIndex}`] && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>{errors[`group_${gIndex}_q_${qIndex}`]}</p>}
                          </div>

                          {needsOptions(group.type) && (
                            <div className="mb-4">
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Options</Label>
                              {q.options.map((opt, oIndex) => (
                                <div key={oIndex} className="flex gap-4 mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <div className="flex-1">
                                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Label</Label>
                                    <Input
                                      placeholder="A, B, C, etc."
                                      value={opt.label}
                                      onChange={(e) => updateGroupQuestionOption(gIndex, qIndex, oIndex, 'label', e.target.value)}
                                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Option Text</Label>
                                    <Input
                                      placeholder="The text of this option"
                                      value={opt.text}
                                      onChange={(e) => updateGroupQuestionOption(gIndex, qIndex, oIndex, 'text', e.target.value)}
                                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={opt.isCorrect}
                                        onChange={(e) => updateGroupQuestionOption(gIndex, qIndex, oIndex, 'isCorrect', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                                      />
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Correct</span>
                                    </label>
                                  </div>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addOptionToGroupQuestion(gIndex, qIndex)}
                                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 text-sm"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                                Add Option
                              </button>
                            </div>
                          )}

                          <div className="mb-4">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correct Answer</Label>
                            <Input
                              placeholder="Enter the correct answer"
                              value={q.correctAnswer}
                              onChange={(e) => updateGroupQuestion(gIndex, qIndex, 'correctAnswer', e.target.value)}
                              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addQuestionToGroup(gIndex)}
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Add Question
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            {/* Review Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">Question Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Limit (seconds)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      name="timeLimit"
                      value={formData.timeLimit}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Sub-Questions</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      name="totalQuestions"
                      value={formData.totalQuestions}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Conditional: Audio + Transcript */}
              {showAudio && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audio URL *</Label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="audio/*"
                        name="formData.content.audioUrl"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const url = URL.createObjectURL(file);
                          setFormData((prev) => ({
                            ...prev,
                            content: {
                              ...prev.content,
                              audioUrl: url,
                            },
                          }));
                          const fd = new FormData();
                          fd.append("file", file);
                          try {
                            const res = await api.post("/upload/audio", fd, {
                              headers: {
                                "Content-Type": "multipart/form-data",
                              }
                            });
                            const uploadedPath = res.data?.file?.path
                            if (uploadedPath) {
                              setFormData(prev => ({
                                ...prev,
                                content: {
                                  ...prev.content, audioUrl: `http://localhost:5000/${uploadedPath}`
                                }
                              }));
                            }
                            toast.success("Audio uploaded successfully");

                          } catch (error) {
                            console.log(error);
                            toast.error("Failed to upload audio");
                          }

                        }}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />

                      {errors.audioUrl && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>{errors.audioUrl}</p>}
                    </div>
                  </div>
                  {formData.content.audioUrl && (
                    <audio controls className="mt-2 w-full">
                      <source src={`http://localhost:5000/${formData.content.audioUrl}`} />
                    </audio>
                  )}

                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transcript</Label>
                    <div className="relative">
                      <textarea
                        name="content.transcript"
                        value={formData.content.transcript}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Enter the audio transcript here..."
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-8">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</Label>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Add relevant tags to categorize your question.</p>

                {formData.tags.map((tag, idx) => (
                  <div key={idx} className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <Input
                        value={tag}
                        onChange={(e) => {
                          const tags = [...formData.tags];
                          tags[idx] = e.target.value;
                          setFormData(p => ({ ...p, tags }));
                        }}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="e.g., reading, ielts, academic"
                      />
                    </div>
                    {formData.tags.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const tags = formData.tags.filter((_, i) => i !== idx);
                          setFormData(p => ({ ...p, tags }));
                        }}
                        className="flex items-center justify-center w-10 h-10 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200 rounded-lg border border-red-200 dark:border-red-800/30 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, tags: [...p.tags, ''] }))}
                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Add Tag
                </button>
              </div>

              <div className="mb-8">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Explanation</Label>
                <div className="relative">
                  <textarea
                    name="explanation"
                    value={formData.explanation}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Explain why this is the correct answer or provide additional context..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <Label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active Question
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">When unchecked, this question will be hidden from users.</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="p-4 max-h-[72vh] overflow-y-auto">
            {renderStepContent()}
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 px-6 md:px-8 py-6 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-all duration-200 ${step === 1
                ? 'text-gray-400 cursor-not-allowed bg-gray-100 dark:bg-gray-800/50'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 shadow-sm'
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Back
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Continue
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleSubmit}
                className="flex items-center gap-2 px-8 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                {isEditing ? 'Update Question' : formData.isQuestionGroup ? 'Create Group' : 'Create Question'}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}