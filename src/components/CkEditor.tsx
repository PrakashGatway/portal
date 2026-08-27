/**
 * This configuration was generated using the CKEditor 5 Builder. You can modify it anytime using this link:
 * https://ckeditor.com/ckeditor-5/builder/#installation/NoNgNARAzAdADDAjBSBWATOkB2ALLgTm0QLgJAA50pUL84K4pc45VVt3U5dsQD02dCggBTAHYo4YYIjDSFYOYgC6kKHEQATfACMIKoA=
 */

import { useState, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
	ClassicEditor,
	Autosave,
	Essentials,
	Paragraph,
	Autoformat,
	TextTransformation,
	LinkImage,
	Link,
	ImageBlock,
	ImageToolbar,
	BlockQuote,
	Bold,
	CloudServices,
	ImageUpload,
	ImageInsertViaUrl,
	AutoImage,
	Table,
	TableToolbar,
	Heading,
	ImageTextAlternative,
	ImageCaption,
	ImageStyle,
	Indent,
	IndentBlock,
	ImageInline,
	Italic,
	List,
	MediaEmbed,
	TableCaption,
	TodoList,
	Underline,
	Fullscreen,
	Markdown,
	PasteFromMarkdownExperimental,
	Strikethrough,
	Code,
	Subscript,
	Superscript,
	FontBackgroundColor,
	FontColor,
	FontFamily,
	FontSize,
	Highlight,
	AutoLink,
	CodeBlock,
	HorizontalLine,
	Alignment,
	Style,
	GeneralHtmlSupport,
	ShowBlocks,
	HtmlComment,
	TextPartLanguage,
	PlainTableOutput,
	SourceEditing
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';

/**
 * Create a free account with a trial: https://portal.ckeditor.com/checkout?plan=free
 */
const LICENSE_KEY = 'GPL'; // or <YOUR_LICENSE_KEY>.

// Create the base configuration outside the component to avoid recreation
const getBaseEditorConfig = () => ({
	plugins: [
		Alignment,
		Autoformat,
		AutoImage,
		AutoLink,
		Autosave,
		BlockQuote,
		Bold,
		CloudServices,
		Code,
		CodeBlock,
		Essentials,
		FontBackgroundColor,
		FontColor,
		FontFamily,
		FontSize,
		Fullscreen,
		GeneralHtmlSupport,
		Heading,
		Highlight,
		HorizontalLine,
		HtmlComment,
		ImageBlock,
		ImageCaption,
		ImageInline,
		ImageInsertViaUrl,
		ImageStyle,
		ImageTextAlternative,
		ImageToolbar,
		ImageUpload,
		Indent,
		IndentBlock,
		Italic,
		Link,
		LinkImage,
		List,
		MediaEmbed,
		Paragraph,
		PlainTableOutput,
		ShowBlocks,
		SourceEditing,
		Strikethrough,
		Style,
		Subscript,
		Superscript,
		Table,
		TableCaption,
		TableToolbar,
		TextPartLanguage,
		TextTransformation,
		TodoList,
		Underline
	],
	licenseKey: LICENSE_KEY,
	fontFamily: {
		supportAllValues: true
	},
	fontSize: {
		options: [10, 12, 14, 'default', 18, 20, 22],
		supportAllValues: true
	},
	fullscreen: {
		onEnterCallback: container =>
			container.classList.add(
				'editor-container',
				'editor-container_classic-editor',
				'editor-container_include-style',
				'editor-container_include-fullscreen',
				'main-container'
			)
	},
	heading: {
		options: [
			{
				model: 'paragraph',
				title: 'Paragraph',
				class: 'ck-heading_paragraph'
			},
			{
				model: 'heading1',
				view: 'h1',
				title: 'Heading 1',
				class: 'ck-heading_heading1'
			},
			{
				model: 'heading2',
				view: 'h2',
				title: 'Heading 2',
				class: 'ck-heading_heading2'
			},
			{
				model: 'heading3',
				view: 'h3',
				title: 'Heading 3',
				class: 'ck-heading_heading3'
			},
			{
				model: 'heading4',
				view: 'h4',
				title: 'Heading 4',
				class: 'ck-heading_heading4'
			},
			{
				model: 'heading5',
				view: 'h5',
				title: 'Heading 5',
				class: 'ck-heading_heading5'
			},
			{
				model: 'heading6',
				view: 'h6',
				title: 'Heading 6',
				class: 'ck-heading_heading6'
			}
		]
	},
	htmlSupport: {
		allow: [
			{
				name: /^.*$/,
				styles: true,
				attributes: true,
				classes: true
			}
		]
	},
	image: {
		toolbar: ['toggleImageCaption', 'imageTextAlternative', '|', 'imageStyle:inline', 'imageStyle:wrapText', 'imageStyle:breakText']
	},
	link: {
		addTargetToExternalLinks: true,
		defaultProtocol: 'https://',
		decorators: {
			toggleDownloadable: {
				mode: 'manual',
				label: 'Downloadable',
				attributes: {
					download: 'file'
				}
			}
		}
	},
	menuBar: {
		isVisible: true
	},
	style: {
		definitions: [
			{
				name: 'Article category',
				element: 'h3',
				classes: ['category']
			},
			{
				name: 'Title',
				element: 'h2',
				classes: ['document-title']
			},
			{
				name: 'Subtitle',
				element: 'h3',
				classes: ['document-subtitle']
			},
			{
				name: 'Info box',
				element: 'p',
				classes: ['info-box']
			},
			{
				name: 'CTA Link Primary',
				element: 'a',
				classes: ['button', 'button--green']
			},
			{
				name: 'CTA Link Secondary',
				element: 'a',
				classes: ['button', 'button--black']
			},
			{
				name: 'Marker',
				element: 'span',
				classes: ['marker']
			},
			{
				name: 'Spoiler',
				element: 'span',
				classes: ['spoiler']
			}
		]
	},
	table: {
		contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
	},
	toolbar: {
		items: [
			'undo',
			'redo',
			'|',
			'sourceEditing',
			'showBlocks',
			'textPartLanguage',
			'fullscreen',
			'|',
			'heading',
			'style',
			'|',
			'fontSize',
			'fontFamily',
			'fontColor',
			'fontBackgroundColor',
			'|',
			'bold',
			'italic',
			'underline',
			'strikethrough',
			'subscript',
			'superscript',
			'code',
			'|',
			'horizontalLine',
			'link',
			'insertImageViaUrl',
			'mediaEmbed',
			'insertTable',
			'highlight',
			'blockQuote',
			'codeBlock',
			'|',
			'alignment',
			'|',
			'bulletedList',
			'numberedList',
			'todoList',
			'outdent',
			'indent'
		],
		shouldNotGroupWhenFull: true
	}
});

const CKEditorComponent = forwardRef(({ 
	value = '', 
	onChange, 
	onReady, 
	onFocus, 
	onBlur, 
	onError,
	placeholder = 'Type or paste your content here!',
	disabled = false,
	readOnly = false,
	className = '',
	containerClassName = '',
	config = {}
}, ref) => {
	const [isLayoutReady, setIsLayoutReady] = useState(false);
	const editorRef = useRef(null);

	useEffect(() => {
		setIsLayoutReady(true);
		return () => setIsLayoutReady(false);
	}, []);

	// Expose editor instance methods via ref
	useImperativeHandle(ref, () => ({
		getEditor: () => editorRef.current,
		setData: (data) => {
			if (editorRef.current) {
				editorRef.current.setData(data);
			}
		},
		getData: () => {
			if (editorRef.current) {
				return editorRef.current.getData();
			}
			return '';
		},
		destroy: () => {
			if (editorRef.current) {
				editorRef.current.destroy();
			}
		}
	}));

	const editorConfig = useMemo(() => {
		if (!isLayoutReady) {
			return null;
		}

		const baseConfig = getBaseEditorConfig();
		
		// Merge custom config with base config
		const mergedConfig = {
			...baseConfig,
			...config,
			root: {
				placeholder: placeholder,
				initialData: value,
				...(config.root || {})
			}
		};

		// Handle disabled/readOnly state
		if (disabled || readOnly) {
			mergedConfig.readOnly = true;
		}

		return mergedConfig;
	}, [isLayoutReady, placeholder, value, config, disabled, readOnly]);

	if (!isLayoutReady || !editorConfig) {
		return <div className={`ckeditor-loading ${className}`}>Loading editor...</div>;
	}

	return (
		<div className={`editor-container editor-container_classic-editor editor-container_include-style editor-container_include-fullscreen ${containerClassName}`}>
			<div className="editor-container__editor">
				<CKEditor
					editor={ClassicEditor}
					config={editorConfig}
					data={value}
					onReady={(editor) => {
						editorRef.current = editor;
						if (onReady) onReady(editor);
					}}
					onChange={(event, editor) => {
						const data = editor.getData();
						if (onChange) onChange(data, editor);
					}}
					onFocus={(event, editor) => {
						if (onFocus) onFocus(event, editor);
					}}
					onBlur={(event, editor) => {
						if (onBlur) onBlur(event, editor);
					}}
					onError={(error, details) => {
						console.error('CKEditor error:', error, details);
						if (onError) onError(error, details);
					}}
					disabled={disabled}
				/>
			</div>
		</div>
	);
});

CKEditorComponent.displayName = 'CKEditorComponent';

export default CKEditorComponent;