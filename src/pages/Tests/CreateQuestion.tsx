import { useState, useEffect } from 'react';
import Input from '../../components/form/input/InputField';
import Label from '../../components/form/Label';
import { toast } from 'react-toastify';
import api from '../../axiosInstance';

const QuestionTypeEnum = [
    'form_completion',
    'note_completion',
    'table_completion',
    'flow_chart_completion',
    'summary_completion',
    'sentence_completion',
    'short_answer',
    'map_labelling',
    'plan_labelling',
    'diagram_labelling',
    'matching_headings',
    'matching_information',
    'matching_features',
    'multiple_choice_single',
    'multiple_choice_multiple',
    'true_false_not_given',
    'yes_no_not_given',
    'pick_from_a_list',
    'classification',
    'matching_sentence_endings',
    'classification_reading',
    'writing_task_1_academic',
    'writing_task_1_general',
    'writing_task_2',
    'speaking_part_1',
    'speaking_part_2',
    'speaking_part_3',
];

export default function CreateQuestionForm({
    examId: initialExamId = '',
    sectionId: initialSectionId = '',
    onClose,
    onSuccess
}) {
    const [formData, setFormData] = useState({
        examId: initialExamId,
        sectionId: initialSectionId,
        marks: 1,
        questionType: 'multiple_choice_single',
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

    useEffect(() => {
        if (initialExamId && initialSectionId) return;

        const fetchRelated = async () => {
            try {
                const [examsRes, sectionsRes] = await Promise.all([
                    api.get('/test/exams'),
                    api.get('/test/sections')
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

    const getMainSection = (type) => {
        if (['form_completion', 'note_completion', 'table_completion', 'flow_chart_completion',
            'summary_completion', 'sentence_completion', 'short_answer',
            'map_labelling', 'plan_labelling', 'diagram_labelling',
            'matching_headings', 'matching_information', 'matching_features',
            'multiple_choice_single', 'multiple_choice_multiple',
            'true_false_not_given', 'yes_no_not_given',
            'pick_from_a_list', 'classification'].includes(type)) {
            return 'Listening';
        }
        if (['matching_sentence_endings', 'classification_reading',
            'multiple_choice_single', 'multiple_choice_multiple',
            'true_false_not_given', 'yes_no_not_given',
            'matching_headings', 'matching_information', 'matching_features',
            'sentence_completion', 'summary_completion', 'note_completion',
            'table_completion', 'flow_chart_completion', 'diagram_labelling',
            'short_answer'].includes(type)) {
            return 'Reading';
        }
        if (['writing_task_1_academic', 'writing_task_1_general', 'writing_task_2'].includes(type)) {
            return 'Writing';
        }
        if (['speaking_part_1', 'speaking_part_2', 'speaking_part_3'].includes(type)) {
            return 'Speaking';
        }
        return null;
    };

    const currentMainSection = getMainSection(formData.questionType);
    const currentSubtype = formData.questionType;
    console.log('Current Main Section:', currentMainSection);

    const isListeningSection = currentMainSection === 'Listening';
    const needsAudioForListening = isListeningSection && [
        'form_completion', 'note_completion', 'table_completion', 'flow_chart_completion',
        'summary_completion', 'sentence_completion', 'short_answer',
        'map_labelling', 'plan_labelling', 'diagram_labelling',
        'matching_headings', 'matching_information', 'matching_features',
        'multiple_choice_single', 'multiple_choice_multiple',
        'pick_from_a_list', 'classification'
    ].includes(currentSubtype);

    const isReadingSection = currentMainSection === 'Reading';
    const needsPassageForReading = isReadingSection;
    const needsOptionsForReading = isReadingSection && [
        'multiple_choice_single', 'multiple_choice_multiple',
        'true_false_not_given', 'yes_no_not_given',
        'matching_headings', 'matching_information', 'matching_features',
        'classification_reading', 'matching_sentence_endings'
    ].includes(currentSubtype);
    const needsCompletionAnswersForReading = isReadingSection && [
        'sentence_completion', 'summary_completion', 'note_completion',
        'table_completion', 'flow_chart_completion'
    ].includes(currentSubtype);

    const isWritingSection = currentMainSection === 'Writing';
    const needsSampleAnswerForWriting = isWritingSection;
    const needsImageForWritingTask1Academic = currentSubtype === 'writing_task_1_academic';

    const isSpeakingSection = currentMainSection === 'Speaking';
    const needsCueCardForSpeakingPart2 = currentSubtype === 'speaking_part_2';

    const needsOptions = [
        'multiple_choice_single', 'multiple_choice_multiple',
        'true_false_not_given', 'yes_no_not_given',
        'matching_headings', 'matching_information', 'matching_features',
        'pick_from_a_list', 'classification', 'classification_reading',
        'matching_sentence_endings'
    ].includes(currentSubtype);

    const needsCompletionAnswers = [
        'form_completion', 'note_completion', 'table_completion', 'flow_chart_completion',
        'summary_completion', 'sentence_completion'
    ].includes(currentSubtype);

    const needsImage = [
        'map_labelling', 'plan_labelling', 'diagram_labelling',
        'writing_task_1_academic'
    ].includes(currentSubtype);

    const formatLabel = (type) => {
        return type
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('content.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                content: { ...prev.content, [field]: value }
            }));
        } else if (name.startsWith('sampleAnswer.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                sampleAnswer: { ...prev.sampleAnswer, [field]: value }
            }));
        } else if (name === 'isActive') {
            setFormData(prev => ({ ...prev, isActive: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const updateArrayField = (index, field, value, arrayName) => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: prev[`${arrayName}`].map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const addArrayItem = (arrayName, template) => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: [...prev[`${arrayName}`], template]
        }));
    };

    const removeArrayItem = (index, arrayName) => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: prev[`${arrayName}`].filter((_, i) => i !== index)
        }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.content.instruction.trim())
            newErrors.instruction = 'Instruction is required';
        if (!formData.examId) newErrors.examId = 'Exam is required';
        if (!formData.sectionId) newErrors.sectionId = 'Section is required';

        if (needsAudioForListening && !formData.content.audioUrl.trim()) {
            newErrors.audioUrl = 'Audio URL is required for listening questions';
        }

        if (needsImage && !formData.content.imageUrl.trim()) {
            newErrors.imageUrl = 'Image URL is required for this question type';
        }

        if (needsOptions && formData.options.length === 0) {
            newErrors.options = 'At least one option is required';
        }

        if (needsCompletionAnswers && formData.options.length === 0) {
            newErrors.options = 'At least one answer is required';
        }

        if (needsSampleAnswerForWriting && !formData.sampleAnswer.text.trim()) {
            newErrors.sampleAnswer = 'Sample answer is required for writing tasks';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            const payload = { ...formData };

            payload.correctAnswer = [];
            if (needsOptions) {
                if (['multiple_choice_single', 'multiple_choice_multiple'].includes(currentSubtype)) {
                    payload.correctAnswer = formData.options
                        .filter(opt => opt.isCorrect)
                        .map(opt => opt.label);
                } else if (['true_false_not_given', 'yes_no_not_given'].includes(currentSubtype)) {
                    const correctOpt = formData.options.find(opt => opt.isCorrect);
                    payload.correctAnswer = correctOpt ? correctOpt.text : '';
                } else if (['matching_headings', 'matching_information', 'matching_features', 'pick_from_a_list', 'classification', 'classification_reading'].includes(currentSubtype)) {
                    payload.correctAnswer = formData.options
                        .filter(opt => opt.isCorrect)
                        .map(opt => ({ label: opt.label, text: opt.text }));
                } else if (currentSubtype === 'matching_sentence_endings') {
                    payload.correctAnswer = formData.options;
                }
            } else if (needsCompletionAnswers) {
                payload.correctAnswer = formData.options.map(opt => opt.text);
            } else if (['speaking_part_1', 'speaking_part_3'].includes(currentSubtype)) {
                payload.correctAnswer = '';
            }

            if (payload.cueCard.prompts.length === 1 && !payload.cueCard.prompts[0]) {
                payload.cueCard.prompts = [];
            }
            if (payload.tags.length === 1 && !payload.tags[0]) {
                payload.tags = [];
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-4">
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
                            {allExams.map(exam => (
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
                            {allSections.map(sec => (
                                <option key={sec._id} value={sec._id}>
                                    {sec.name || sec.title}
                                </option>
                            ))}
                        </select>
                        {errors.sectionId && <p className="mt-1 text-sm text-red-600">{errors.sectionId}</p>}
                    </div>
                )}

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
                    <Label htmlFor="mainType">Type of Question *</Label>
                    <select name="mainType" id="mainType" value={formData.mainType} onChange={handleChange} className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                        <option value="">Select Type</option>
                        <option value="listening">Listening</option>
                        <option value="reading">Reading</option>
                        <option value="writing">Writing</option>
                        <option value="speaking">Speaking</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div>
                    <Label htmlFor="questionType">Question Type *</Label>
                    <select
                        id="questionType"
                        name="questionType"
                        value={formData.questionType}
                        onChange={handleChange}
                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                        <optgroup label="Listening">
                            <option value="form_completion">{formatLabel('form_completion')}</option>
                            <option value="note_completion">{formatLabel('note_completion')}</option>
                            <option value="table_completion">{formatLabel('table_completion')}</option>
                            <option value="flow_chart_completion">{formatLabel('flow_chart_completion')}</option>
                            <option value="summary_completion">{formatLabel('summary_completion')}</option>
                            <option value="sentence_completion">{formatLabel('sentence_completion')}</option>
                            <option value="short_answer">{formatLabel('short_answer')}</option>
                            <option value="map_labelling">{formatLabel('map_labelling')}</option>
                            <option value="plan_labelling">{formatLabel('plan_labelling')}</option>
                            <option value="diagram_labelling">{formatLabel('diagram_labelling')}</option>
                            <option value="multiple_choice_single">{formatLabel('multiple_choice_single')}</option>
                            <option value="multiple_choice_multiple">{formatLabel('multiple_choice_multiple')}</option>
                            <option value="true_false_not_given">{formatLabel('true_false_not_given')}</option>
                            <option value="yes_no_not_given">{formatLabel('yes_no_not_given')}</option>
                            <option value="pick_from_a_list">{formatLabel('pick_from_a_list')}</option>
                            <option value="classification">{formatLabel('classification')}</option>
                        </optgroup>
                        <optgroup label="Reading">
                            <option value="multiple_choice_single">{formatLabel('multiple_choice_single')}</option>
                            <option value="multiple_choice_multiple">{formatLabel('multiple_choice_multiple')}</option>
                            <option value="true_false_not_given">{formatLabel('true_false_not_given')}</option>
                            <option value="yes_no_not_given">{formatLabel('yes_no_not_given')}</option>
                            <option value="matching_headings">{formatLabel('matching_headings')}</option>
                            <option value="matching_information">{formatLabel('matching_information')}</option>
                            <option value="matching_features">{formatLabel('matching_features')}</option>
                            <option value="sentence_completion">{formatLabel('sentence_completion')}</option>
                            <option value="summary_completion">{formatLabel('summary_completion')}</option>
                            <option value="note_completion">{formatLabel('note_completion')}</option>
                            <option value="table_completion">{formatLabel('table_completion')}</option>
                            <option value="flow_chart_completion">{formatLabel('flow_chart_completion')}</option>
                            <option value="diagram_labelling">{formatLabel('diagram_labelling')}</option>
                            <option value="short_answer">{formatLabel('short_answer')}</option>
                            <option value="matching_sentence_endings">{formatLabel('matching_sentence_endings')}</option>
                            <option value="classification_reading">{formatLabel('classification_reading')}</option>
                        </optgroup>
                        <optgroup label="Writing">
                            <option value="writing_task_1_academic">{formatLabel('writing_task_1_academic')}</option>
                            <option value="writing_task_1_general">{formatLabel('writing_task_1_general')}</option>
                            <option value="writing_task_2">{formatLabel('writing_task_2')}</option>
                        </optgroup>
                        <optgroup label="Speaking">
                            <option value="speaking_part_1">{formatLabel('speaking_part_1')}</option>
                            <option value="speaking_part_2">{formatLabel('speaking_part_2')}</option>
                            <option value="speaking_part_3">{formatLabel('speaking_part_3')}</option>
                        </optgroup>
                    </select>
                    {errors.questionType && <p className="mt-1 text-sm text-red-600">{errors.questionType}</p>}
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

            {(isReadingSection || isWritingSection) && (
                <div>
                    <Label htmlFor="passageText">Passage Text / Writing Context</Label>
                    <textarea
                        id="passageText"
                        name="content.passageText"
                        value={formData.content.passageText}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        placeholder="Reading passage or Writing Task context"
                    />
                </div>
            )}

            {needsAudioForListening && (
                <div>
                    <Label htmlFor="transcript">Transcript (Admin Reference)</Label>
                    <textarea
                        id="transcript"
                        name="content.transcript"
                        value={formData.content.transcript}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        placeholder="Full listening script for admin use"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {needsImage && (
                    <div>
                        <Label htmlFor="imageUrl">Image URL *</Label>
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
                {needsAudioForListening && (
                    <div>
                        <Label htmlFor="audioUrl">Audio URL *</Label>
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
                {currentSubtype === 'video_response' && (
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

            {needsOptions && (
                <div>
                    <Label>Options</Label>
                    {formData.options.map((opt, idx) => (
                        <div key={idx} className="flex flex-wrap gap-2 mb-3 items-end">
                            <Input
                                type="text"
                                placeholder="Label (A, B, i, ii...)"
                                value={opt.label}
                                onChange={(e) => updateArrayField(idx, 'label', e.target.value, 'options')}
                                className="w-16"
                            />
                            <Input
                                type="text"
                                placeholder="Option Text"
                                value={opt.text}
                                onChange={(e) => updateArrayField(idx, 'text', e.target.value, 'options')}
                                className="flex-1"
                            />
                            {(['multiple_choice_single', 'multiple_choice_multiple', 'true_false_not_given', 'yes_no_not_given', 'matching_sentence_endings'].includes(currentSubtype)) && (
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
                        onClick={() => addArrayItem('options', { label: '', text: '', isCorrect: false, explanation: '' })}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                        + Add Option
                    </button>
                    {errors.options && <p className="mt-1 text-sm text-red-600">{errors.options}</p>}
                </div>
            )}

            {needsCompletionAnswers && (
                <div>
                    <Label>Correct Answers (one per blank)</Label>
                    {formData.options.map((opt, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                            <Input
                                placeholder={`Answer for blank ${idx + 1}`}
                                value={opt.text}
                                onChange={(e) => updateArrayField(idx, 'text', e.target.value, 'options')}
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
                        onClick={() => addArrayItem('options', { label: '', text: '', isCorrect: false, explanation: '' })}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                        + Add Blank Answer
                    </button>
                    {errors.options && <p className="mt-1 text-sm text-red-600">{errors.options}</p>}
                </div>
            )}

            {needsCueCardForSpeakingPart2 && (
                <div>
                    <Label htmlFor="cueCardTopic">Cue Card Topic</Label>
                    <Input
                        id="cueCardTopic"
                        type="text"
                        value={formData.cueCard.topic}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            cueCard: { ...prev.cueCard, topic: e.target.value }
                        }))}
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
                                    setFormData(prev => ({
                                        ...prev,
                                        cueCard: { ...prev.cueCard, prompts: newPrompts }
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
                                        setFormData(prev => ({
                                            ...prev,
                                            cueCard: { ...prev.cueCard, prompts: newPrompts }
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
                        onClick={() => setFormData(prev => ({
                            ...prev,
                            cueCard: { ...prev.cueCard, prompts: [...prev.cueCard.prompts, ''] }
                        }))}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                        + Add Prompt
                    </button>
                </div>
            )}

            {needsSampleAnswerForWriting && (
                <div>
                    <Label htmlFor="sampleAnswerText">Sample Answer *</Label>
                    <textarea
                        id="sampleAnswerText"
                        name="sampleAnswer.text"
                        value={formData.sampleAnswer.text}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        placeholder="Model answer for writing tasks"
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
                            <Label htmlFor="sampleAnswerBandScore">Band Score (0-9)</Label>
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

            <div>
                <Label htmlFor="explanation">Explanation</Label>
                <textarea
                    id="explanation"
                    name="explanation"
                    value={formData.explanation}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder="Why is this the correct answer?"
                />
            </div>

            <div>
                <Label>Tags (e.g., ielts, academic, map)</Label>
                {formData.tags.map((tag, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                        <Input
                            type="text"
                            value={tag}
                            onChange={(e) => {
                                const newTags = [...formData.tags];
                                newTags[idx] = e.target.value;
                                setFormData(prev => ({ ...prev, tags: newTags }));
                            }}
                            className="flex-1"
                        />
                        {formData.tags.length > 1 && (
                            <button
                                type="button"
                                onClick={() => {
                                    const newTags = formData.tags.filter((_, i) => i !== idx);
                                    setFormData(prev => ({ ...prev, tags: newTags }));
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
                    onClick={() => setFormData(prev => ({ ...prev, tags: [...prev.tags, ''] }))}
                    className="mt-2 text-blue-600 hover:text-blue-800"
                >
                    + Add Tag
                </button>
            </div>

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