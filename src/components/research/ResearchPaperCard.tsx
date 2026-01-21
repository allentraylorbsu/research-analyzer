/**
 * ResearchPaperCard Component
 * Display card for a research paper with actions
 */

import { Button } from '../common'
import type { ResearchPaper } from '@/types'

export interface ResearchPaperCardProps {
  paper: ResearchPaper
  onView?: (paper: ResearchPaper) => void
  onEdit?: (paper: ResearchPaper) => void
  onDelete?: (paper: ResearchPaper) => void
  onConnect?: (paper: ResearchPaper) => void
  showActions?: boolean
  isSelected?: boolean
  onSelect?: (paper: ResearchPaper) => void
}

export function ResearchPaperCard({
  paper,
  onView,
  onEdit,
  onDelete,
  onConnect,
  showActions = true,
  isSelected = false,
  onSelect
}: ResearchPaperCardProps) {
  return (
    <div
      className={`
        border rounded-lg p-4 transition-all
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}
        ${onSelect ? 'cursor-pointer' : ''}
      `}
      onClick={onSelect ? () => onSelect(paper) : undefined}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate" title={paper.title}>
            {paper.title}
          </h3>

          {paper.firstAuthor && (
            <p className="text-sm text-gray-600 mt-1">
              {paper.firstAuthor}
              {paper.allAuthors && paper.allAuthors !== paper.firstAuthor && ' et al.'}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
            {paper.journal && (
              <span className="truncate max-w-[200px]" title={paper.journal}>
                {paper.journal}
              </span>
            )}
            {paper.publicationYear && (
              <span>{paper.publicationYear}</span>
            )}
          </div>

          {paper.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {paper.categories.slice(0, 3).map(category => (
                <span
                  key={category}
                  className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
                >
                  {category}
                </span>
              ))}
              {paper.categories.length > 3 && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">
                  +{paper.categories.length - 3} more
                </span>
              )}
            </div>
          )}

          {paper.abstract && (
            <p className="text-sm text-gray-600 mt-3 line-clamp-2">
              {paper.abstract}
            </p>
          )}
        </div>

        {isSelected && (
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-blue-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {showActions && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          {onView && (
            <Button
              size="small"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onView(paper)
              }}
            >
              View
            </Button>
          )}
          {onConnect && (
            <Button
              size="small"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation()
                onConnect(paper)
              }}
            >
              Connect to Policy
            </Button>
          )}
          {onEdit && (
            <Button
              size="small"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(paper)
              }}
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              size="small"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(paper)
              }}
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default ResearchPaperCard
