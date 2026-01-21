/**
 * PDF Processor Service
 * Extract text content from PDF files using PDF.js
 */

import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

export interface PdfExtractionResult {
  text: string
  pageCount: number
  metadata: PdfMetadata
}

export interface PdfMetadata {
  title?: string
  author?: string
  subject?: string
  keywords?: string
  creator?: string
  producer?: string
  creationDate?: Date
  modificationDate?: Date
}

export interface PdfProcessingOptions {
  maxPages?: number
  includePageNumbers?: boolean
}

/**
 * Extract text from a PDF file
 */
export async function extractTextFromPdf(
  file: File,
  options: PdfProcessingOptions = {}
): Promise<PdfExtractionResult> {
  const { maxPages = Infinity, includePageNumbers = false } = options

  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    const metadata = await extractMetadata(pdf)
    const pageCount = pdf.numPages
    const pagesToProcess = Math.min(pageCount, maxPages)

    const textParts: string[] = []

    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      const pageText = textContent.items
        .map((item) => {
          if ('str' in item) {
            return item.str
          }
          return ''
        })
        .join(' ')

      if (includePageNumbers) {
        textParts.push(`[Page ${pageNum}]\n${pageText}`)
      } else {
        textParts.push(pageText)
      }
    }

    const text = textParts.join('\n\n')

    return {
      text: cleanExtractedText(text),
      pageCount,
      metadata
    }
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Extract text from a PDF URL
 */
export async function extractTextFromUrl(
  url: string,
  options: PdfProcessingOptions = {}
): Promise<PdfExtractionResult> {
  const { maxPages = Infinity, includePageNumbers = false } = options

  try {
    const pdf = await pdfjsLib.getDocument(url).promise

    const metadata = await extractMetadata(pdf)
    const pageCount = pdf.numPages
    const pagesToProcess = Math.min(pageCount, maxPages)

    const textParts: string[] = []

    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      const pageText = textContent.items
        .map((item) => {
          if ('str' in item) {
            return item.str
          }
          return ''
        })
        .join(' ')

      if (includePageNumbers) {
        textParts.push(`[Page ${pageNum}]\n${pageText}`)
      } else {
        textParts.push(pageText)
      }
    }

    const text = textParts.join('\n\n')

    return {
      text: cleanExtractedText(text),
      pageCount,
      metadata
    }
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error(
      `Failed to extract text from PDF URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Extract metadata from PDF document
 */
async function extractMetadata(
  pdf: pdfjsLib.PDFDocumentProxy
): Promise<PdfMetadata> {
  try {
    const metadata = await pdf.getMetadata()
    const info = metadata.info as Record<string, unknown>

    return {
      title: info?.Title ? String(info.Title) : undefined,
      author: info?.Author ? String(info.Author) : undefined,
      subject: info?.Subject ? String(info.Subject) : undefined,
      keywords: info?.Keywords ? String(info.Keywords) : undefined,
      creator: info?.Creator ? String(info.Creator) : undefined,
      producer: info?.Producer ? String(info.Producer) : undefined,
      creationDate: parseDate(info?.CreationDate),
      modificationDate: parseDate(info?.ModDate)
    }
  } catch {
    return {}
  }
}

/**
 * Parse PDF date string to Date object
 */
function parseDate(dateStr: unknown): Date | undefined {
  if (!dateStr || typeof dateStr !== 'string') {
    return undefined
  }

  // PDF dates are in format: D:YYYYMMDDHHmmSS
  const match = dateStr.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/)
  if (match) {
    const [, year, month, day, hour = '00', minute = '00', second = '00'] = match
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    )
  }

  return undefined
}

/**
 * Clean extracted text
 */
function cleanExtractedText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove excessive line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Fix common OCR issues
    .replace(/\s+([.,;:!?])/g, '$1')
    // Trim each line
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    // Final trim
    .trim()
}

/**
 * Estimate reading time for extracted text
 */
export function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200
  const wordCount = text.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

/**
 * Extract abstract from research paper text
 */
export function extractAbstract(text: string): string | undefined {
  // Common patterns for abstract section
  const patterns = [
    /abstract[:\s]*\n?([\s\S]*?)(?=\n\s*(?:introduction|background|keywords|1\.|methods))/i,
    /(?:^|\n)abstract[:\s]*([\s\S]*?)(?:\n\s*\n)/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const abstract = match[1].trim()
      if (abstract.length > 50 && abstract.length < 5000) {
        return abstract
      }
    }
  }

  return undefined
}

/**
 * Extract title from research paper text
 */
export function extractTitle(text: string, metadata?: PdfMetadata): string {
  // Use metadata title if available and it's not a generic name
  if (metadata?.title && metadata.title.length > 5) {
    const metaTitle = metadata.title.trim()
    // Skip generic metadata titles
    const genericPatterns = /^(untitled|document|microsoft|adobe|pdf)/i
    if (!genericPatterns.test(metaTitle)) {
      return metaTitle
    }
  }

  // Get first several non-empty lines
  const lines = text
    .split(/\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .slice(0, 15) // Check first 15 lines

  // Skip patterns that are clearly not titles
  const skipPatterns = [
    /^(volume|vol\.|issue|iss\.|page|pp\.|doi:|http|www\.|©|copyright|\d{4})/i,
    /^(journal of|the journal|proceedings|transactions)/i,
    /^\d+$/, // Just numbers
    /^[a-z]$/, // Single lowercase letter
    /^(research|original|article|review|study|paper)$/i,
    /^(published|received|accepted|revised)/i
  ]

  // Find the best title candidate
  for (const line of lines) {
    // Skip very short or very long lines
    if (line.length < 15 || line.length > 300) continue

    // Skip lines matching skip patterns
    if (skipPatterns.some(pattern => pattern.test(line))) continue

    // Skip lines that are mostly numbers or special characters
    const alphaRatio = (line.match(/[a-zA-Z]/g) || []).length / line.length
    if (alphaRatio < 0.5) continue

    // This looks like a title
    return line
  }

  // Fallback: try to find a line that looks like a sentence/title
  for (const line of lines) {
    if (line.length >= 10 && line.length <= 200) {
      const alphaRatio = (line.match(/[a-zA-Z]/g) || []).length / line.length
      if (alphaRatio > 0.6) {
        return line
      }
    }
  }

  return 'Untitled Document'
}

/**
 * Extract authors from research paper text
 */
export function extractAuthors(text: string, metadata?: PdfMetadata): string | undefined {
  // Use metadata author if available
  if (metadata?.author) {
    return metadata.author
  }

  // Look for author patterns after title
  const patterns = [
    /(?:by|authors?)[:\s]*([\w\s,.-]+?)(?:\n|$)/i,
    /^([\w\s,.-]+?)(?:\n\s*(?:department|university|college|institute))/im
  ]

  for (const pattern of patterns) {
    const match = text.slice(0, 2000).match(pattern)
    if (match && match[1]) {
      const authors = match[1].trim()
      if (authors.length > 3 && authors.length < 500) {
        return authors
      }
    }
  }

  return undefined
}

export default {
  extractTextFromPdf,
  extractTextFromUrl,
  estimateReadingTime,
  extractAbstract,
  extractTitle,
  extractAuthors
}
