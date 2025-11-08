import { useState, useEffect } from 'react';
import Input from '../../components/form/input/InputField';
import Label from '../../components/form/Label';
import { toast } from 'react-toastify';
import api from '../../axiosInstance';
import RichTextEditor from '../../components/TextEditor';

// ======================
// CONFIGURATION (YOUR EXACT DATA)
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
  // ... keep all your QUESTION_SUBTYPES exactly as provided
  toefl: { /* your data */ },
  pte: { /* your data */ },
  gre: { /* your data */ },
  gmat: { /* your data */ },
  sat: { /* your data */ },
  duolingo: { /* your data */ },
  other: { /* your data */ },
};

const formatLabel = (str) => {
  return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// ======================
// Utility: Check field requirements
// ======================

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

// ======================
// MAIN COMPONENT
// ======================

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
    examId: initialExamId,
    sectionId: initialSectionId,
    mainType: '',
    isQuestionGroup: false,
    // Single mode
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
  const [allExams, setAllExams] = useState([]);
  const [allSections, setAllSections] = useState([]);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // Fetch exams/sections
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
        toast.error('Failed to load exams/sections');
      }
    };
    fetchRelated();
  }, [initialExamId, initialSectionId]);

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

  // ==== Group handlers (same as before - omitted for brevity) ====
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
      if (!initialExamId && !formData.examId) newErrors.examId = 'Exam is required';
      if (!initialSectionId && !formData.sectionId) newErrors.sectionId = 'Section is required';
    } else if (stepNum === 2) {
      if (!formData.isQuestionGroup) {
        if (!formData.questionType) newErrors.questionType = 'Question type is required';
        if (!formData.content.instruction?.trim()) newErrors.instruction = 'Instruction is required';

        if (isReading(formData.mainType) && !formData.content.passageText?.trim()) {
          newErrors.passageText = 'Reading passage is required';
        }
        if (isListening(formData.mainType) && !formData.content.audioUrl?.trim()) {
          newErrors.audioUrl = 'Audio URL is required for Listening';
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
      examId: formData.examId,
      sectionId: formData.sectionId,
      isQuestionGroup: formData.isQuestionGroup,
      marks: formData.marks,
      difficulty: formData.difficulty,
      tags: formData.tags.filter(t => t.trim()),
      timeLimit: formData.timeLimit,
      isActive: formData.isActive,
      content: formData.content,
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
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  // ======================
  // DERIVED STATE
  // ======================

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
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="isQuestionGroup"
                  checked={formData.isQuestionGroup}
                  onChange={(e) => handleChange({ target: { name: 'isQuestionGroup', checked: e.target.checked } })}
                  className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <Label htmlFor="isQuestionGroup" className="font-medium text-blue-800">
                    Create as Question Group?
                  </Label>
                  <p className="text-sm text-blue-700 mt-1">Use for blocks like "Questions 1–5"</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label>Exam Type *</Label>
                <select
                  name="examType"
                  value={formData.examType}
                  onChange={handleChange}
                  className="w-full mt-1 rounded-lg border border-gray-300 bg-white py-2 px-3"
                >
                  <option value="">Select</option>
                  {EXAM_TYPES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
                {errors.examType && <p className="text-red-600 text-sm mt-1">{errors.examType}</p>}
              </div>

              {!initialExamId && (
                <div>
                  <Label>Exam *</Label>
                  <select
                    name="examId"
                    value={formData.examId}
                    onChange={handleChange}
                    className="w-full mt-1 rounded-lg border border-gray-300 bg-white py-2 px-3"
                  >
                    <option value="">Select</option>
                    {allExams.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                  </select>
                  {errors.examId && <p className="text-red-600 text-sm mt-1">{errors.examId}</p>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {!initialSectionId && (
                <div>
                  <Label>Section *</Label>
                  <select
                    name="sectionId"
                    value={formData.sectionId}
                    onChange={handleChange}
                    className="w-full mt-1 rounded-lg border border-gray-300 bg-white py-2 px-3"
                  >
                    <option value="">Select</option>
                    {allSections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                  {errors.sectionId && <p className="text-red-600 text-sm mt-1">{errors.sectionId}</p>}
                </div>
              )}

              <div>
                <Label>Section Type *</Label>
                <select
                  name="mainType"
                  value={formData.mainType}
                  onChange={handleChange}
                  disabled={!formData.examType}
                  className="w-full mt-1 rounded-lg border border-gray-300 bg-white py-2 px-3"
                >
                  <option value="">Select</option>
                  {availableMainSections.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {errors.mainType && <p className="text-red-600 text-sm mt-1">{errors.mainType}</p>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Main Fields */}
            <div className="bg-white p-5 rounded-xl border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {!formData.isQuestionGroup && <div>
                  <Label className="text-sm text-gray-600">Question Type *</Label>
                  <select
                    name="questionType"
                    value={formData.questionType}
                    onChange={handleChange}
                    disabled={!formData.mainType || formData.isQuestionGroup}
                    className="w-full mt-1 rounded-lg border border-gray-300 bg-white py-2 px-3"
                  >
                    <option value="">Select</option>
                    {availableQuestionTypes.map(t => <option key={t} value={t}>{formatLabel(t)}</option>)}
                  </select>
                  {errors.questionType && <p className="text-red-600 text-xs mt-1">{errors.questionType}</p>}
                </div>}
                <div>
                  <Label className="text-sm text-gray-600">Marks</Label>
                  <Input type="number" name="marks" value={formData.marks} onChange={handleChange} min="0" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Difficulty</Label>
                  <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full mt-1 rounded-lg border border-gray-300 bg-white py-2 px-3">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Instruction */}
              <div>
                <Label className="text-sm text-gray-600">Instruction *</Label>
                <textarea
                  name="content.instruction"
                  value={formData.content.instruction}
                  onChange={handleChange}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Complete the form. Write ONE WORD ONLY."
                />
                {errors.instruction && <p className="text-red-600 text-xs mt-1">{errors.instruction}</p>}
              </div>
            </div>

            {/* Conditional: Passage */}
            {showPassage && (
              <div className="bg-gray-50 p-4 rounded-xl">
                <Label>Reading Passage *</Label>
                <Input
                  type="text"
                  placeholder="Passage Title"
                  value={formData.content.passageTitle}
                  onChange={(e) => handleChange({ target: { name: 'content.passageTitle', value: e.target.value } })}
                  className="mb-2"
                />
                {/* <textarea
                  name="content.passageText"
                  value={formData.content.passageText}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Paste full passage..."
                /> */}
                <Label>Passage content *</Label>
                <RichTextEditor
                  initialValue={formData.content.passageText}
                  onChange={(e) => handleChange({ target: { name: 'content.passageText', value: e } })}
                />
                {errors.passageText && <p className="text-red-600 text-sm mt-1">{errors.passageText}</p>}
              </div>
            )}

            {/* Conditional: Audio + Transcript */}
            {showAudio && (
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Audio URL *</Label>
                    <Input
                      type="text"
                      name="content.audioUrl"
                      value={formData.content.audioUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/audio.mp3"
                    />
                    {errors.audioUrl && <p className="text-red-600 text-sm mt-1">{errors.audioUrl}</p>}
                  </div>
                  <div>
                    <Label>Transcript</Label>
                    <textarea
                      name="content.transcript"
                      value={formData.content.transcript}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Conditional: Options */}
            {showOptions && (
              <div className="bg-gray-50 p-4 rounded-xl">
                <Label>Options</Label>
                {formData.options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 p-2 bg-white rounded">
                    <Input placeholder="Label" value={opt.label} onChange={(e) => updateArrayField(idx, 'label', e.target.value, 'options')} className="w-16" />
                    <Input placeholder="Text" value={opt.text} onChange={(e) => updateArrayField(idx, 'text', e.target.value, 'options')} className="flex-1" />
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={opt.isCorrect} onChange={(e) => updateArrayField(idx, 'isCorrect', e.target.checked, 'options')} className="h-4 w-4" />
                      <span className="text-sm">Correct</span>
                    </label>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem('options', { label: '', text: '', isCorrect: false, explanation: '' })} className="text-blue-600 mt-2">
                  + Add Option
                </button>
              </div>
            )}

            {/* Conditional: Completion Blanks */}
            {showCompletion && (
              <div className="bg-gray-50 p-4 rounded-xl">
                <Label>Correct Answers (one per blank)</Label>
                {formData.options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Input placeholder={`Answer ${idx + 1}`} value={opt.text} onChange={(e) => updateArrayField(idx, 'text', e.target.value, 'options')} className="flex-1" />
                    {formData.options.length > 1 && (
                      <button type="button" onClick={() => removeArrayItem(idx, 'options')} className="text-red-600 self-end pb-2">Remove</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem('options', { label: '', text: '', isCorrect: false, explanation: '' })} className="text-blue-600 mt-2">
                  + Add Answer
                </button>
              </div>
            )}

            {/* Conditional: Cue Card */}
            {showCueCard && (
              <div className="bg-gray-50 p-4 rounded-xl">
                <Label>Speaking Cue Card</Label>
                <Input type="text" placeholder="Topic" value={formData.cueCard.topic} onChange={(e) => setFormData(p => ({ ...p, cueCard: { ...p.cueCard, topic: e.target.value } }))} className="mb-2" />
                {formData.cueCard.prompts.map((prompt, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Input placeholder="Prompt" value={prompt} onChange={(e) => {
                      const prompts = [...formData.cueCard.prompts];
                      prompts[idx] = e.target.value;
                      setFormData(p => ({ ...p, cueCard: { ...p.cueCard, prompts } }));
                    }} className="flex-1" />
                    {formData.cueCard.prompts.length > 1 && <button type="button" onClick={() => {
                      const prompts = formData.cueCard.prompts.filter((_, i) => i !== idx);
                      setFormData(p => ({ ...p, cueCard: { ...p.cueCard, prompts } }));
                    }} className="text-red-600 self-end pb-2">Remove</button>}
                  </div>
                ))}
                <button type="button" onClick={() => setFormData(p => ({ ...p, cueCard: { ...p.cueCard, prompts: [...p.cueCard.prompts, ''] } }))} className="text-blue-600 mt-2">
                  + Add Prompt
                </button>
              </div>
            )}

            {/* Conditional: Sample Answer */}
            {showSampleAnswer && (
              <div className="bg-gray-50 p-4 rounded-xl">
                <Label>Sample Answer</Label>
                <textarea
                  name="sampleAnswer.text"
                  value={formData.sampleAnswer.text}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label className="text-sm text-gray-600">Word Count</Label>
                    <Input type="number" name="sampleAnswer.wordCount" value={formData.sampleAnswer.wordCount} onChange={handleChange} />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Score</Label>
                    <Input type="number" name="sampleAnswer.bandScore" value={formData.sampleAnswer.bandScore} onChange={handleChange} step="0.5" min="0" max="9" />
                  </div>
                </div>
              </div>
            )}

            {/* GROUP MODE */}
            {formData.isQuestionGroup && (
              <div className="space-y-5 pt-6 border-t">
                <h3 className="font-semibold text-lg">Question Groups</h3>
                {formData.questionGroup.map((group, gIndex) => (
                  <div key={gIndex} className="bg-white p-5 rounded-xl border">
                    <div className="flex justify-between mb-4">
                      <h4 className="font-medium">Group {gIndex + 1}</h4>
                      {formData.questionGroup.length > 1 && <button type="button" onClick={() => removeGroup(gIndex)} className="text-red-600">Remove</button>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label>Title *</Label>
                        <Input value={group.title} onChange={(e) => updateGroupField(gIndex, 'title', e.target.value)} />
                        {errors[`group_${gIndex}_title`] && <p className="text-red-600 text-xs">{errors[`group_${gIndex}_title`]}</p>}
                      </div>
                      <div>
                        <Label>Question Type *</Label>
                        <select value={group.type} onChange={(e) => updateGroupField(gIndex, 'type', e.target.value)} className="w-full mt-1 rounded-lg border border-gray-300 bg-white py-2 px-3">
                          <option value="">Select</option>
                          {availableQuestionTypes.map(t => <option key={t} value={t}>{formatLabel(t)}</option>)}
                        </select>
                        {errors[`group_${gIndex}_type`] && <p className="text-red-600 text-xs">{errors[`group_${gIndex}_type`]}</p>}
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label>Instruction *</Label>
                      <textarea
                        value={group.instruction}
                        onChange={(e) => updateGroupField(gIndex, 'instruction', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      {errors[`group_${gIndex}_instruction`] && <p className="text-red-600 text-xs">{errors[`group_${gIndex}_instruction`]}</p>}
                    </div>

                    <div>
                      <Label>Questions</Label>
                      {group.questions.map((q, qIndex) => (
                        <div key={qIndex} className="mt-3 p-3 bg-gray-50 rounded">
                          <Input placeholder="Question stem" value={q.question} onChange={(e) => updateGroupQuestion(gIndex, qIndex, 'question', e.target.value)} className="mb-2" />
                          {errors[`group_${gIndex}_q_${qIndex}`] && <p className="text-red-600 text-xs mb-1">{errors[`group_${gIndex}_q_${qIndex}`]}</p>}

                          {needsOptions(group.type) && q.options.map((opt, oIndex) => (
                            <div key={oIndex} className="flex gap-2 mt-1">
                              <Input placeholder="Label" value={opt.label} onChange={(e) => updateGroupQuestionOption(gIndex, qIndex, oIndex, 'label', e.target.value)} className="w-16" />
                              <Input placeholder="Text" value={opt.text} onChange={(e) => updateGroupQuestionOption(gIndex, qIndex, oIndex, 'text', e.target.value)} className="flex-1" />
                              <label className="flex items-center gap-1">
                                <input type="checkbox" checked={opt.isCorrect} onChange={(e) => updateGroupQuestionOption(gIndex, qIndex, oIndex, 'isCorrect', e.target.checked)} className="h-4 w-4" />
                                <span className="text-sm">Correct</span>
                              </label>
                            </div>
                          ))}

                          {needsCompletion(group.type) && (
                            <Input placeholder="Correct answer" value={q.correctAnswer} onChange={(e) => updateGroupQuestion(gIndex, qIndex, 'correctAnswer', e.target.value)} className="mt-2" />
                          )}

                          {needsOptions(group.type) && (
                            <button type="button" onClick={() => addOptionToGroupQuestion(gIndex, qIndex)} className="text-blue-600 text-sm mt-2">+ Option</button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => addQuestionToGroup(gIndex)} className="text-blue-600 mt-2">+ Add Question</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addGroup} className="w-full py-2.5 bg-blue-50 text-blue-700 rounded-lg font-medium">+ Add Another Group</button>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
              <h3 className="text-lg font-semibold">Review & Finalize</h3>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label>Time Limit (seconds)</Label>
                <Input type="number" name="timeLimit" value={formData.timeLimit} onChange={handleChange} min="0" />
              </div>
              <div>
                <Label>Tags</Label>
                {formData.tags.map((tag, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Input value={tag} onChange={(e) => {
                      const tags = [...formData.tags];
                      tags[idx] = e.target.value;
                      setFormData(p => ({ ...p, tags }));
                    }} className="flex-1" />
                    {formData.tags.length > 1 && <button type="button" onClick={() => {
                      const tags = formData.tags.filter((_, i) => i !== idx);
                      setFormData(p => ({ ...p, tags }));
                    }} className="text-red-600 self-end pb-2">Remove</button>}
                  </div>
                ))}
                <button type="button" onClick={() => setFormData(p => ({ ...p, tags: [...p.tags, ''] }))} className="text-blue-600 mt-2">+ Add Tag</button>
              </div>
            </div>

            <div>
              <Label>Explanation</Label>
              <textarea
                name="explanation"
                value={formData.explanation}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Why is this correct?"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
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
          </div>
        );

      default:
        return null;
    }
  };

  // ======================
  // RENDER
  // ======================

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Bar */}
      {/* <div className="mb-8 w-3/4 mx-auto">
        <div className="flex justify-between mb-2">
          {[1, 2, 3].map(num => (
            <div key={num} className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {num}
              </div>
              <span className="mt-1 text-sm font-medium text-gray-600">
                {num === 1 ? 'Type' : num === 2 ? 'Content' : 'Review'}
              </span>
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>
      </div> */}

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 md:p-8 max-h-[75vh] overflow-y-auto">
          {renderStepContent()}
        </div>

        <div className="bg-gray-50 px-6 md:px-8 py-4 flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className={`px-5 py-2.5 rounded-lg font-medium ${step === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'}`}
          >
            ← Back
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Continue →
            </button>
          ) : (
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {isEditing ? 'Update Question' : formData.isQuestionGroup ? 'Create Group' : 'Create Question'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}