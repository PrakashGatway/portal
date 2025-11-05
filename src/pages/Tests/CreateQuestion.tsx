import { useState, useEffect } from 'react';
import Input from '../../components/form/input/InputField';
import Label from '../../components/form/Label';
import { toast } from 'react-toastify';
import api from '../../axiosInstance';

// ======================
// Configuration Data
// ======================

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

// Question subtypes per exam + main section (simplified mapping)
const QUESTION_SUBTYPES = {
  // IELTS
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
  // TOEFL
  toefl: {
    listening: ['multiple_choice_single', 'multiple_choice_multiple', 'ordering', 'matching'],
    reading: ['multiple_choice_single', 'insert_sentence', 'summary', 'vocabulary', 'reference'],
    speaking: ['independent_task', 'integrated_task'],
    writing: ['integrated_writing', 'independent_writing'],
  },
  // PTE
  pte: {
    listening: ['highlight_correct_summary', 'multiple_choice_single', 'multiple_choice_multiple', 'fill_blanks', 'select_missing_word', 'highlight_incorrect_words', 'write_from_dictation'],
    reading: ['multiple_choice_single', 'multiple_choice_multiple', 'reorder_paragraphs', 'fill_blanks', 'reading_writing_fill_blanks'],
    writing: ['summarize_written_text', 'essay'],
    speaking: ['read_aloud', 'repeat_sentence', 'describe_image', 're_tell_lecture', 'answer_short_question'],
  },
  // GRE
  gre: {
    verbal: ['text_completion', 'sentence_equivalence', 'reading_comprehension'],
    quant: ['quantitative_comparison', 'multiple_choice_single', 'multiple_choice_multiple', 'numeric_entry'],
    awa: ['issue_task', 'argument_task'],
  },
  // GMAT
  gmat: {
    verbal: ['critical_reasoning', 'reading_comprehension', 'sentence_correction'],
    quant: ['data_sufficiency', 'problem_solving'],
    ir: ['table_analysis', 'graphics_interpretation', 'multi_source_reasoning', 'two_part_analysis'],
    awa: ['analysis_of_an_argument'],
  },
  // SAT
  sat: {
    reading: ['evidence_support', 'vocabulary_in_context', 'main_idea', 'inference'],
    writing: ['grammar', 'sentence_structure', 'punctuation', 'organization'],
    math: ['heart_of_algebra', 'problem_solving_data_analysis', 'passport_to_advanced_math', 'additional_topics'],
    essay: ['reading_analysis_writing'],
  },
  // Duolingo
  duolingo: {
    listening: ['listen_and_type', 'listen_and_speak'],
    reading: ['read_and_complete', 'read_and_answer'],
    speaking: ['speak_on_topic', 'read_and_speak'],
    writing: ['write_on_topic', 'complete_the_sentence'],
    production: ['speak_on_image', 'write_on_image'],
    completion: ['fill_blanks', 'highlight_text'],
  },
  // Other
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

// Helper to format label
const formatLabel = (str) => {
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

// ======================
// Main Component
// ======================

export default function CreateQuestionForm({
  examId: initialExamId = '',
  sectionId: initialSectionId = '',
  onClose,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    examType: '', // ielts, gre, etc.
    examId: initialExamId,
    sectionId: initialSectionId,
    mainType: '', // listening, reading, quant, etc.
    questionType: '',
    marks: 1,
    difficulty: 'medium',
    content: {
      instruction: '',
      passageText: '',
      transcript: '',
      imageUrl: '',
      audioUrl: '',
      videoUrl: '',
    },
    cueCard: {
      topic: '',
      prompts: [''],
    },
    options: [{ label: '', text: '', isCorrect: false, explanation: '' }],
    sampleAnswer: {
      text: '',
      wordCount: 0,
      bandScore: 0,
    },
    explanation: '',
    tags: [''],
    timeLimit: 0,
    isActive: true,
  });

  const [errors, setErrors] = useState({});
  const [allExams, setAllExams] = useState([]);
  const [allSections, setAllSections] = useState([]);

  // Fetch exams/sections only if not pre-filled
  useEffect(() => {
    if (initialExamId && initialSectionId) return;

    const fetchRelated = async () => {
      try {
        const [examsRes, sectionsRes] = await Promise.all([
          api.get('/test/exams'),
          api.get('/test/sections'),
        ]);
        setAllExams(examsRes.data?.data || []);
        setAllSections(sectionsRes.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch exams/sections');
        toast.error('Failed to load exams/sections');
      }
    };
    fetchRelated();
  }, [initialExamId, initialSectionId]);

  // Derived booleans
  const isListening = formData.mainType === 'listening';
  const isReading = formData.mainType === 'reading';
  const isWriting = formData.mainType === 'writing' || formData.mainType === 'awa' || formData.mainType === 'essay';
  const isSpeaking = formData.mainType === 'speaking';
  const isQuant = formData.mainType === 'quant' || formData.mainType === 'math';
  const isVerbal = formData.mainType === 'verbal';

  // Conditional fields
  const needsAudio = isListening || (formData.examType === 'pte' && isSpeaking);
  const needsPassage = isReading || (isWriting && !['writing_task_1_academic'].includes(formData.questionType));
  const needsImage = ['map_labelling', 'plan_labelling', 'diagram_labelling', 'writing_task_1_academic', 'describe_image'].includes(formData.questionType);
  const needsCueCard = formData.questionType === 'speaking_part_2' || formData.questionType === 'describe_image';
  const needsSampleAnswer = isWriting || formData.mainType === 'awa' || formData.mainType === 'essay';

  const needsOptions = [
    'multiple_choice_single', 'multiple_choice_multiple', 'matching', 'matching_headings',
    'matching_information', 'matching_features', 'classification', 'classification_reading',
    'matching_sentence_endings', 'text_completion', 'sentence_equivalence', 'critical_reasoning',
    'sentence_correction', 'data_sufficiency', 'problem_solving', 'table_analysis', 'two_part_analysis',
    'read_aloud', 'reorder_paragraphs', 'highlight_correct_summary'
  ].includes(formData.questionType);

  const needsCompletionAnswers = [
    'form_completion', 'note_completion', 'table_completion', 'flow_chart_completion',
    'summary_completion', 'sentence_completion', 'fill_blanks', 'write_from_dictation'
  ].includes(formData.questionType);

  // Handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('content.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        content: { ...prev.content, [field]: value },
      }));
    } else if (name.startsWith('sampleAnswer.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        sampleAnswer: { ...prev.sampleAnswer, [field]: value },
      }));
    } else if (name === 'isActive') {
      setFormData((prev) => ({ ...prev, isActive: checked }));
    } else if (name === 'examType') {
      // Reset dependent fields when exam changes
      setFormData((prev) => ({
        ...prev,
        examType: value,
        mainType: '',
        questionType: '',
        options: [{ label: '', text: '', isCorrect: false, explanation: '' }],
      }));
    } else if (name === 'mainType') {
      // Reset questionType when mainType changes
      setFormData((prev) => ({
        ...prev,
        mainType: value,
        questionType: '',
        options: [{ label: '', text: '', isCorrect: false, explanation: '' }],
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const updateArrayField = (index, field, value, arrayName) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addArrayItem = (arrayName, template) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: [...prev[arrayName], template],
    }));
  };

  const removeArrayItem = (index, arrayName) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.examType) newErrors.examType = 'Exam type is required';
    if (!formData.mainType) newErrors.mainType = 'Section type is required';
    if (!formData.questionType) newErrors.questionType = 'Question type is required';
    if (!formData.content.instruction.trim()) newErrors.instruction = 'Instruction is required';
    if (!initialExamId && !formData.examId) newErrors.examId = 'Exam is required';
    if (!initialSectionId && !formData.sectionId) newErrors.sectionId = 'Section is required';

    if (needsAudio && !formData.content.audioUrl.trim()) {
      newErrors.audioUrl = 'Audio URL is required';
    }
    if (needsImage && !formData.content.imageUrl.trim()) {
      newErrors.imageUrl = 'Image URL is required';
    }
    if (needsSampleAnswer && !formData.sampleAnswer.text.trim()) {
      newErrors.sampleAnswer = 'Sample answer is required';
    }
    if ((needsOptions || needsCompletionAnswers) && formData.options.length === 0) {
      newErrors.options = 'At least one option/answer is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = { ...formData };

      // Clean up prompts & tags
      if (payload.cueCard.prompts.length === 1 && !payload.cueCard.prompts[0]) {
        payload.cueCard.prompts = [];
      }
      if (payload.tags.length === 1 && !payload.tags[0]) {
        payload.tags = [];
      }

      // Build correctAnswer based on type
      payload.correctAnswer = '';
      if (needsOptions || needsCompletionAnswers) {
        if (['multiple_choice_single', 'data_sufficiency'].includes(formData.questionType)) {
          payload.correctAnswer = formData.options.filter(o => o.isCorrect).map(o => o.label);
        } else if (['multiple_choice_multiple'].includes(formData.questionType)) {
          payload.correctAnswer = formData.options.filter(o => o.isCorrect).map(o => o.label);
        } else if (needsCompletionAnswers) {
          payload.correctAnswer = formData.options.map(o => o.text);
        } else {
          payload.correctAnswer = formData.options;
        }
      }

      await api.post('/test/questions', payload);
      toast.success('Question created successfully!');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error creating question:', err);
      toast.error(err.response?.data?.message || 'Failed to create question');
    }
  };

  // Get available main sections based on exam
  const availableMainSections = MAIN_SECTIONS[formData.examType] || [];
  const availableQuestionTypes = QUESTION_SUBTYPES[formData.examType]?.[formData.mainType] || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 max-h-[80vh] overflow-y-auto">
      {/* Exam Type */}
      <div>
        <Label htmlFor="examType">Exam Type *</Label>
        <select
          id="examType"
          name="examType"
          value={formData.examType}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">Select Exam</option>
          {EXAM_TYPES.map((exam) => (
            <option key={exam.value} value={exam.value}>
              {exam.label}
            </option>
          ))}
        </select>
        {errors.examType && <p className="mt-1 text-sm text-red-600">{errors.examType}</p>}
      </div>

      {/* Exam & Section (if not prefilled) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {!initialExamId && (
          <div>
            <Label htmlFor="examId">Exam *</Label>
            <select
              id="examId"
              name="examId"
              value={formData.examId}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select Exam</option>
              {allExams.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.name || exam.title}
                </option>
              ))}
            </select>
            {errors.examId && <p className="mt-1 text-sm text-red-600">{errors.examId}</p>}
          </div>
        )}
        {!initialSectionId && (
          <div>
            <Label htmlFor="sectionId">Section *</Label>
            <select
              id="sectionId"
              name="sectionId"
              value={formData.sectionId}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select Section</option>
              {allSections.map((sec) => (
                <option key={sec._id} value={sec._id}>
                  {sec.name || sec.title}
                </option>
              ))}
            </select>
            {errors.sectionId && <p className="mt-1 text-sm text-red-600">{errors.sectionId}</p>}
          </div>
        )}
      </div>

      {/* Main Section & Question Type */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="mainType">Question Section *</Label>
          <select
            id="mainType"
            name="mainType"
            value={formData.mainType}
            onChange={handleChange}
            disabled={!formData.examType}
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Select Section</option>
            {availableMainSections.map((sec) => (
              <option key={sec.value} value={sec.value}>
                {sec.label}
              </option>
            ))}
          </select>
          {errors.mainType && <p className="mt-1 text-sm text-red-600">{errors.mainType}</p>}
        </div>

        <div>
          <Label htmlFor="questionType">Question Type *</Label>
          <select
            id="questionType"
            name="questionType"
            value={formData.questionType}
            onChange={handleChange}
            disabled={!formData.mainType}
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Select Question Type</option>
            {availableQuestionTypes.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>
          {errors.questionType && <p className="mt-1 text-sm text-red-600">{errors.questionType}</p>}
        </div>
      </div>

      {/* Common Fields */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <Label htmlFor="marks">Marks</Label>
          <Input
            id="marks"
            type="number"
            name="marks"
            value={formData.marks}
            onChange={handleChange}
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="difficulty">Difficulty</Label>
          <select
            id="difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
          <Input
            id="timeLimit"
            type="number"
            name="timeLimit"
            value={formData.timeLimit}
            onChange={handleChange}
            min="0"
          />
        </div>
      </div>

      {/* Instruction */}
      <div>
        <Label htmlFor="instruction">Instruction *</Label>
        <textarea
          id="instruction"
          name="content.instruction"
          value={formData.content.instruction}
          onChange={handleChange}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          placeholder="e.g., Complete the form. Write ONE WORD ONLY."
        />
        {errors.instruction && <p className="mt-1 text-sm text-red-600">{errors.instruction}</p>}
      </div>

      {/* Passage / Context */}
      {needsPassage && (
        <div>
          <Label htmlFor="passageText">
            {isWriting ? 'Writing Prompt / Context' : 'Reading Passage'}
          </Label>
          <textarea
            id="passageText"
            name="content.passageText"
            value={formData.content.passageText}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
        </div>
      )}

      {/* Transcript */}
      {needsAudio && (
        <div>
          <Label htmlFor="transcript">Transcript (Admin Reference)</Label>
          <textarea
            id="transcript"
            name="content.transcript"
            value={formData.content.transcript}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
        </div>
      )}

      {/* Media URLs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {needsImage && (
          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="text"
              name="content.imageUrl"
              value={formData.content.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/chart.jpg"
            />
            {errors.imageUrl && <p className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>}
          </div>
        )}
        {needsAudio && (
          <div>
            <Label htmlFor="audioUrl">Audio URL</Label>
            <Input
              id="audioUrl"
              type="text"
              name="content.audioUrl"
              value={formData.content.audioUrl}
              onChange={handleChange}
              placeholder="https://example.com/audio.mp3"
            />
            {errors.audioUrl && <p className="mt-1 text-sm text-red-600">{errors.audioUrl}</p>}
          </div>
        )}
        {formData.questionType === 'video_response' && (
          <div>
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input
              id="videoUrl"
              type="text"
              name="content.videoUrl"
              value={formData.content.videoUrl}
              onChange={handleChange}
              placeholder="https://example.com/video.mp4"
            />
          </div>
        )}
      </div>

      {/* Options / Answers */}
      {(needsOptions || needsCompletionAnswers) && (
        <div>
          <Label>
            {needsCompletionAnswers ? 'Correct Answers (one per blank)' : 'Options'}
          </Label>
          {formData.options.map((opt, idx) => (
            <div key={idx} className="flex flex-wrap gap-2 mb-3 items-end">
              {needsOptions && !needsCompletionAnswers && (
                <Input
                  type="text"
                  placeholder="Label (A, B, i, ii...)"
                  value={opt.label}
                  onChange={(e) => updateArrayField(idx, 'label', e.target.value, 'options')}
                  className="w-16"
                />
              )}
              <Input
                type="text"
                placeholder={
                  needsCompletionAnswers
                    ? `Answer for blank ${idx + 1}`
                    : 'Option Text'
                }
                value={opt.text}
                onChange={(e) => updateArrayField(idx, 'text', e.target.value, 'options')}
                className="flex-1"
              />
              {(['multiple_choice_single', 'multiple_choice_multiple'].includes(formData.questionType)) && (
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={opt.isCorrect}
                    onChange={(e) => updateArrayField(idx, 'isCorrect', e.target.checked, 'options')}
                  />
                  Correct
                </label>
              )}
              <Input
                type="text"
                placeholder="Explanation"
                value={opt.explanation}
                onChange={(e) => updateArrayField(idx, 'explanation', e.target.value, 'options')}
                className="flex-1"
              />
              {formData.options.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem(idx, 'options')}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              addArrayItem('options', {
                label: '',
                text: '',
                isCorrect: false,
                explanation: '',
              })
            }
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            + Add {needsCompletionAnswers ? 'Answer' : 'Option'}
          </button>
          {errors.options && <p className="mt-1 text-sm text-red-600">{errors.options}</p>}
        </div>
      )}

      {/* Cue Card (Speaking Part 2 / Describe Image) */}
      {needsCueCard && (
        <div>
          <Label htmlFor="cueCardTopic">Topic / Image Description</Label>
          <Input
            id="cueCardTopic"
            type="text"
            value={formData.cueCard.topic}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                cueCard: { ...prev.cueCard, topic: e.target.value },
              }))
            }
            placeholder="Describe a memorable journey"
          />
          <Label className="mt-3">Prompts</Label>
          {formData.cueCard.prompts.map((prompt, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <Input
                type="text"
                value={prompt}
                onChange={(e) => {
                  const newPrompts = [...formData.cueCard.prompts];
                  newPrompts[idx] = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    cueCard: { ...prev.cueCard, prompts: newPrompts },
                  }));
                }}
                placeholder="e.g., Where did you go?"
                className="flex-1"
              />
              {formData.cueCard.prompts.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const newPrompts = formData.cueCard.prompts.filter((_, i) => i !== idx);
                    setFormData((prev) => ({
                      ...prev,
                      cueCard: { ...prev.cueCard, prompts: newPrompts },
                    }));
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                cueCard: { ...prev.cueCard, prompts: [...prev.cueCard.prompts, ''] },
              }))
            }
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            + Add Prompt
          </button>
        </div>
      )}

      {/* Sample Answer (Writing / AWA) */}
      {needsSampleAnswer && (
        <div>
          <Label htmlFor="sampleAnswerText">Sample Answer *</Label>
          <textarea
            id="sampleAnswerText"
            name="sampleAnswer.text"
            value={formData.sampleAnswer.text}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder="Model answer"
          />
          {errors.sampleAnswer && <p className="mt-1 text-sm text-red-600">{errors.sampleAnswer}</p>}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <Label htmlFor="sampleAnswerWordCount">Word Count</Label>
              <Input
                id="sampleAnswerWordCount"
                type="number"
                name="sampleAnswer.wordCount"
                value={formData.sampleAnswer.wordCount}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="sampleAnswerBandScore">Score (0-9 or %)</Label>
              <Input
                id="sampleAnswerBandScore"
                type="number"
                name="sampleAnswer.bandScore"
                value={formData.sampleAnswer.bandScore}
                onChange={handleChange}
                step="0.5"
                min="0"
                max="9"
              />
            </div>
          </div>
        </div>
      )}

      {/* Explanation & Tags */}
      <div>
        <Label htmlFor="explanation">Explanation</Label>
        <textarea
          id="explanation"
          name="explanation"
          value={formData.explanation}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <Label>Tags</Label>
        {formData.tags.map((tag, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <Input
              type="text"
              value={tag}
              onChange={(e) => {
                const newTags = [...formData.tags];
                newTags[idx] = e.target.value;
                setFormData((prev) => ({ ...prev, tags: newTags }));
              }}
              className="flex-1"
            />
            {formData.tags.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const newTags = formData.tags.filter((_, i) => i !== idx);
                  setFormData((prev) => ({ ...prev, tags: newTags }));
                }}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, tags: [...prev.tags, ''] }))}
          className="mt-2 text-blue-600 hover:text-blue-800"
        >
          + Add Tag
        </button>
      </div>

      {/* Active Toggle */}
      <div className="flex items-center gap-2 pt-4">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-300 bg-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create Question
        </button>
      </div>
    </form>
  );
}