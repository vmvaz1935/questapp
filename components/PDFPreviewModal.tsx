import React, { useEffect, useState } from 'react';

interface PDFPreviewModalProps {
  pdfBlob: Blob | null;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

/**
 * Modal para preview de PDF antes de download
 */
export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  pdfBlob,
  fileName,
  isOpen,
  onClose,
  onDownload,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (pdfBlob && isOpen) {
      setIsLoading(true);
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPdfUrl(null);
    }
  }, [pdfBlob, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-preview-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="pdf-preview-title" className="text-xl font-bold text-gray-800 dark:text-white">
            Preview do PDF: {fileName}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              aria-label="Baixar PDF"
            >
              Baixar PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              aria-label="Fechar preview"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden p-4">
          {isLoading && !pdfUrl ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" role="status" aria-label="Carregando PDF">
                <span className="sr-only">Carregando PDF...</span>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border border-gray-300 dark:border-gray-600 rounded-lg"
              title="Preview do PDF"
              aria-label="Preview do PDF"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <p>Nenhum PDF disponível para preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewModal;

