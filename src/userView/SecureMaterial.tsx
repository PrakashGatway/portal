import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { toolbarPlugin } from '@react-pdf-viewer/toolbar';
import { FileText, Image as ImageIcon, Music, Link as LinkIcon, ExternalLink, AlertTriangle, Lock } from 'lucide-react';
import api from '../axiosInstance'; // Adjust this import path to match your project structure

// Import PDF Viewer styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/toolbar/lib/styles/index.css';
import { Loader } from '../components/fullScreeLoader';

const SecureMaterialViewer = ({ material: initialMaterial }) => {
  const { slug } = useParams();
  const [material, setMaterial] = useState(initialMaterial || null);
  const [loading, setLoading] = useState(!initialMaterial);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch material if not passed as a prop
  useEffect(() => {
    if (initialMaterial) {
      setMaterial(initialMaterial);
      setLoading(false);
      return;
    }

    if (slug) {
      const fetchMaterial = async () => {
        try {
          setLoading(true);
          // Adjust the endpoint to match your actual API route for fetching a single resource
          const response = await api.get(`/content/resources/${slug}`);
          if (response.data.success) {
            setMaterial(response.data.data);
          } else {
            setError('Failed to fetch material details.');
          }
        } catch (err) {
          console.error('Error fetching material:', err);
          setError('Unable to load the study material. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      fetchMaterial();
    }
  }, [slug, initialMaterial]);

  if (!isClient || loading) {
    return (
      <div className="flex animate-pulse animate-bounce p-4 items-start justify-center h-[85vh] rounded-xl">
        {/* Header */}
        <div className="w-full animate-pulse flex flex-col gap-4">
          <div className="h-40 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-100 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="flex items-center justify-center h-[85vh] rounded-xl">
        <div className="text-center max-w-md p-6">
          <AlertTriangle className="h-25 w-25 stroke-1 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Material</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'Material not found.'}</p>
        </div>
      </div>
    );
  }

  const fileUrl = 'https://uat.gatewayabroadeducations.com/uploads/g.pdf';
  const watermarkText = material.instructor?.email || material.course?.title || 'Confidential';

  const renderContent = () => {
    switch (material.materialType) {
      case 'pdf':
      case 'document':
        return <PdfViewer fileUrl={fileUrl} watermarkText={watermarkText} />;

      case 'image':
        return (
          <div className="relative w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 overflow-hidden">
            <Watermark text={watermarkText} />
            <img
              src={fileUrl}
              alt={material.title}
              className="max-w-full max-h-[80vh] object-contain shadow-lg rounded-lg select-none"
              draggable="false"
              onContextMenu={(e) => e.preventDefault()} // Prevent right-click save
            />
          </div>
        );

      case 'audio':
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
            <Watermark text={watermarkText} />
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-2xl text-center z-10 border border-gray-200 dark:border-gray-700">
              <Music className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{material.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Secure Audio Player</p>
              <audio
                controls
                src={fileUrl}
                className="w-full"
                onContextMenu={(e) => e.preventDefault()} // Prevent right-click save
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        );

      case 'link':
        return (
          <div className="relative w-full h-full flex items-center justify-center p-8">
            <Watermark text={watermarkText} />
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-2xl text-center z-10 border border-gray-200 dark:border-gray-700">
              <LinkIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{material.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                This is an external resource. Click below to open it.
              </p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                Open External Link <ExternalLink className="h-4 w-4" />
              </a>
              <p className="text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" /> Opening external links takes you outside the secure environment.
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Unsupported material type: {material.materialType}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className='p-3'>
      <div className="relative w-full max-w-7xl mx-auto rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{material.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {material.materialType} • {material.course?.title || 'General'}
            </p>
          </div>

        </div>

        {/* Content Area */}
        <div className="relative" style={{ height: '85vh' }}>
          {renderContent()}
        </div>
      </div>
    </div>

  );
};

// --- Sub-Components ---

const PdfViewer = ({ fileUrl, watermarkText }) => {
  const toolbarPluginInstance = toolbarPlugin();
  const { Toolbar } = toolbarPluginInstance;

  return (
    <div className="relative w-full h-full bg-gray-100 dark:bg-gray-900">
      <Watermark text={watermarkText} />
      <div className="relative z-20 flex flex-col h-full">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <div className="flex flex-col h-full">
            {/* Custom Toolbar */}
            <div className="flex items-center bg-gray-200 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 p-2 gap-1 flex-wrap">
              <Toolbar>
                {(props) => {
                  const {
                    CurrentPageInput,
                    EnterFullScreen,
                    GoToNextPage,
                    GoToPreviousPage,
                    NumberOfPages,
                    ZoomIn,
                    ZoomOut,
                  } = props;
                  return (
                    <>
                      <div className="px-1"><ZoomOut /></div>
                      <div className="px-1"><ZoomIn /></div>
                      <div className="px-1 ml-auto"><GoToPreviousPage /></div>
                      <div className="px-1 flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 font-medium">
                        <CurrentPageInput />
                        <span>/</span>
                        <NumberOfPages />
                      </div>
                      <div className="px-1"><GoToNextPage /></div>
                      <div className="px-1 ml-auto"><EnterFullScreen /></div>
                    </>
                  );
                }}
              </Toolbar>
            </div>

            {/* PDF Viewer Canvas */}
            <div className="flex-1 overflow-auto bg-gray-300 dark:bg-gray-900">
              {fileUrl ? (
                <Viewer
                  fileUrl={fileUrl.trim()}
                  plugins={[toolbarPluginInstance]}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No PDF file available.
                </div>
              )}
            </div>
          </div>
        </Worker>
      </div>
    </div>
  );
};

const Watermark = ({ text = 'Confidential' }) => (
  <div className="absolute inset-0 pointer-events-none z-50 opacity-20 overflow-hidden select-none">
    <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap rotate-12">
      {text}
    </div>
    <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 translate-y-1/2 text-5xl font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap -rotate-12">
      Ooshas Prep
    </div>
  </div>
);

export default SecureMaterialViewer;