/**
 * DuplicateDetector Component
 * Displays and manages duplicate research paper detection
 */

import { useMemo } from 'react'
import { Button, StatusMessage, CollapsibleSection } from '../common'
import type { DuplicateGroup, ResearchPaper } from '@/types'

export interface DuplicateDetectorProps {
  duplicates: DuplicateGroup[]
  onMerge?: (papers: ResearchPaper[], keepId: string) => void
  onMarkUnique?: (paper: ResearchPaper) => void
  onDelete?: (paper: ResearchPaper) => void
  verifiedUniqueIds?: Set<string>
}

export function DuplicateDetector({
  duplicates,
  onMerge,
  onMarkUnique,
  onDelete,
  verifiedUniqueIds = new Set()
}: DuplicateDetectorProps) {
  const activeDuplicates = useMemo(() => {
    return duplicates.map(group => ({
      ...group,
      papers: group.papers.filter(p => !verifiedUniqueIds.has(p.id))
    })).filter(group => group.papers.length > 1)
  }, [duplicates, verifiedUniqueIds])

  const totalDuplicates = activeDuplicates.reduce(
    (sum, group) => sum + group.papers.length - 1,
    0
  )

  if (activeDuplicates.length === 0) {
    return (
      <StatusMessage
        type="success"
        message="No duplicates detected"
        details="All research papers have unique titles"
      />
    )
  }

  return (
    <div className="space-y-4">
      <StatusMessage
        type="warning"
        message={`${totalDuplicates} potential duplicate${totalDuplicates > 1 ? 's' : ''} found`}
        details={`${activeDuplicates.length} group${activeDuplicates.length > 1 ? 's' : ''} of papers with similar titles`}
      />

      <div className="space-y-3">
        {activeDuplicates.map((group, groupIndex) => (
          <DuplicateGroupCard
            key={group.normalizedTitle}
            group={group}
            groupIndex={groupIndex}
            onMerge={onMerge}
            onMarkUnique={onMarkUnique}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}

interface DuplicateGroupCardProps {
  group: DuplicateGroup
  groupIndex: number
  onMerge?: (papers: ResearchPaper[], keepId: string) => void
  onMarkUnique?: (paper: ResearchPaper) => void
  onDelete?: (paper: ResearchPaper) => void
}

function DuplicateGroupCard({
  group,
  groupIndex,
  onMerge,
  onMarkUnique,
  onDelete
}: DuplicateGroupCardProps) {
  return (
    <CollapsibleSection
      title={`Group ${groupIndex + 1}: "${group.papers[0]?.title.slice(0, 50)}..."`}
      badge={group.papers.length}
      defaultOpen={groupIndex === 0}
    >
      <div className="space-y-3">
        {group.papers.map((paper, paperIndex) => (
          <div
            key={paper.id}
            className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm">
                {paper.title}
              </h4>
              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                {paper.firstAuthor && <p>Author: {paper.firstAuthor}</p>}
                {paper.journal && <p>Journal: {paper.journal}</p>}
                {paper.publicationYear && <p>Year: {paper.publicationYear}</p>}
                <p>Added: {paper.createdAt.toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              {onMerge && paperIndex === 0 && group.papers.length > 1 && (
                <Button
                  size="small"
                  variant="primary"
                  onClick={() => onMerge(group.papers, paper.id)}
                >
                  Keep this
                </Button>
              )}
              {onMarkUnique && (
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => onMarkUnique(paper)}
                >
                  Not duplicate
                </Button>
              )}
              {onDelete && (
                <Button
                  size="small"
                  variant="danger"
                  onClick={() => onDelete(paper)}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}

        <div className="text-xs text-gray-500 pt-2 border-t">
          <strong>Tip:</strong> Click &quot;Keep this&quot; on the paper you want to keep, and others will be merged or deleted.
          Click &quot;Not duplicate&quot; if papers with similar titles are actually different.
        </div>
      </div>
    </CollapsibleSection>
  )
}

export default DuplicateDetector
