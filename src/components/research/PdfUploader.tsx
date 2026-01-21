/**
 * PdfUploader Component
 * Drag-and-drop PDF file upload with text extraction
 */

import { useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react'
import { LoadingSpinner, StatusMessage } from '../common'
import { extractTextFromPdf, extractTitle, extractAuthors, extractAbstract } from '@/services/pdfProcessor'
import type { PdfMetadata } from '@/services/pdfProcessor'

export interface PdfUploadResult {
  text: string
  title: string
  authors?: string
  abstract?: string
  pageCount: number
  metadata: PdfMetadata
  fileName: string
}

export interface PdfUploaderProps {
  onUpload: (result: PdfUploadResult) => void
  onError?: (error: string) => void
  maxSizeMB?: number
  accept?: string
}

export function PdfUploader({
  onUpload,
  onError,
  maxSizeMB = 10,
  accept = '.pdf'
}: PdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.includes('pdf')) {
      const errorMsg = 'Please upload a PDF file'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    // Validate file size
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      const errorMsg = `File size exceeds ${maxSizeMB}MB limit`
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    setIsProcessing(true)
    setError(null)
    setFileName(file.name)

    try {
      const result = await extractTextFromPdf(file)
      const title = extractTitle(result.text, result.metadata)
      const authors = extractAuthors(result.text, result.metadata)
      const abstract = extractAbstract(result.text)

      onUpload({
        text: result.text,
        title,
        authors,
        abstract,
        pageCount: result.pageCount,
        metadata: result.metadata,
        fileName: file.name
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process PDF'
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setIsProcessing(false)
    }
  }, [maxSizeMB, onUpload, onError])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }, [processFile])

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }, [processFile])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleClear = useCallback(() => {
    setFileName(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={isProcessing ? undefined : handleClick}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isProcessing ? 'cursor-wait' : 'cursor-pointer'}
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
      >
        {isProcessing ? (
          <div className="space-y-4">
            <LoadingSpinner size="large" />
            <p className="text-gray-600">Processing {fileName}...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg
                className={`w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-gray-700 font-medium">
                {isDragging ? 'Drop your PDF here' : 'Drag and drop a PDF file'}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                or click to browse (max {maxSizeMB}MB)
              </p>
            </div>
            {fileName && !error && (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm">{fileName} uploaded</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClear()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4">
          <StatusMessage
            type="error"
            message={error}
            onDismiss={() => setError(null)}
          />
        </div>
      )}
    </div>
  )
}

export default PdfUploader
