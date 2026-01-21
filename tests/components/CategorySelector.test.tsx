/**
 * CategorySelector Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CategorySelector } from '@/components/research/CategorySelector'
import { RESEARCH_CATEGORIES } from '@/types'

describe('CategorySelector', () => {
  const defaultProps = {
    selected: [] as string[],
    onChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all research categories', () => {
    render(<CategorySelector {...defaultProps} />)

    RESEARCH_CATEGORIES.forEach(category => {
      expect(screen.getByText(category)).toBeInTheDocument()
    })
  })

  it('should show selection count', () => {
    render(<CategorySelector {...defaultProps} selected={['Healthcare Workforce', 'Rural Health']} />)

    expect(screen.getByText(/2\/5 selected/)).toBeInTheDocument()
  })

  it('should call onChange when category is clicked', () => {
    const onChange = vi.fn()
    render(<CategorySelector {...defaultProps} onChange={onChange} />)

    fireEvent.click(screen.getByText('Healthcare Workforce'))

    expect(onChange).toHaveBeenCalledWith(['Healthcare Workforce'])
  })

  it('should remove category when clicking selected category', () => {
    const onChange = vi.fn()
    render(
      <CategorySelector
        selected={['Healthcare Workforce', 'Rural Health']}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByText('Healthcare Workforce'))

    expect(onChange).toHaveBeenCalledWith(['Rural Health'])
  })

  it('should respect maxSelections limit', () => {
    const onChange = vi.fn()
    render(
      <CategorySelector
        selected={['Healthcare Workforce', 'Rural Health', 'Primary Care', 'Mental Health', 'Public Health']}
        onChange={onChange}
        maxSelections={5}
      />
    )

    // Try to select another category when at limit
    const unselectedCategory = screen.getByText('Specialty Care')

    // The button should be disabled
    expect(unselectedCategory).toBeDisabled()
  })

  it('should show warning when at max selections', () => {
    render(
      <CategorySelector
        selected={['Healthcare Workforce', 'Rural Health', 'Primary Care', 'Mental Health', 'Public Health']}
        onChange={vi.fn()}
        maxSelections={5}
      />
    )

    expect(screen.getByText(/Maximum 5 categories/)).toBeInTheDocument()
  })

  it('should show checkmark on selected categories', () => {
    render(
      <CategorySelector
        selected={['Healthcare Workforce']}
        onChange={vi.fn()}
      />
    )

    const selectedButton = screen.getByText('Healthcare Workforce').closest('button')
    expect(selectedButton?.querySelector('svg')).toBeInTheDocument()
  })

  it('should show clear all button when categories are selected', () => {
    render(
      <CategorySelector
        selected={['Healthcare Workforce']}
        onChange={vi.fn()}
      />
    )

    expect(screen.getByText('Clear all')).toBeInTheDocument()
  })

  it('should hide clear all button when no categories selected', () => {
    render(<CategorySelector {...defaultProps} />)

    expect(screen.queryByText('Clear all')).not.toBeInTheDocument()
  })

  it('should call onChange with empty array when clear all is clicked', () => {
    const onChange = vi.fn()
    render(
      <CategorySelector
        selected={['Healthcare Workforce', 'Rural Health']}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByText('Clear all'))

    expect(onChange).toHaveBeenCalledWith([])
  })

  it('should be disabled when disabled prop is true', () => {
    render(
      <CategorySelector
        {...defaultProps}
        disabled={true}
      />
    )

    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })

  it('should apply selected styles to selected categories', () => {
    render(
      <CategorySelector
        selected={['Healthcare Workforce']}
        onChange={vi.fn()}
      />
    )

    const selectedButton = screen.getByText('Healthcare Workforce').closest('button')
    expect(selectedButton?.className).toContain('bg-blue-100')
  })

  it('should allow custom maxSelections', () => {
    render(
      <CategorySelector
        selected={[]}
        onChange={vi.fn()}
        maxSelections={3}
      />
    )

    expect(screen.getByText(/0\/3 selected/)).toBeInTheDocument()
  })
})
