/**
 * StateFilter Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StateFilter } from '@/components/visualization/StateFilter'

describe('StateFilter', () => {
  const defaultProps = {
    selectedState: null,
    onStateChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render with placeholder text', () => {
    render(<StateFilter {...defaultProps} placeholder="Select state..." />)

    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Select state...')).toBeInTheDocument()
  })

  it('should display all 50 states', () => {
    render(<StateFilter {...defaultProps} />)

    const select = screen.getByRole('combobox')
    // 50 states + 1 placeholder option
    expect(select.querySelectorAll('option').length).toBe(51)
  })

  it('should call onStateChange when state is selected', () => {
    const onStateChange = vi.fn()
    render(<StateFilter {...defaultProps} onStateChange={onStateChange} />)

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'CALIFORNIA' } })

    expect(onStateChange).toHaveBeenCalledWith('CALIFORNIA')
  })

  it('should call onStateChange with null when placeholder is selected', () => {
    const onStateChange = vi.fn()
    render(
      <StateFilter
        selectedState="CALIFORNIA"
        onStateChange={onStateChange}
      />
    )

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: '' } })

    expect(onStateChange).toHaveBeenCalledWith(null)
  })

  it('should show selected state', () => {
    render(
      <StateFilter
        selectedState="CALIFORNIA"
        onStateChange={vi.fn()}
      />
    )

    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('CALIFORNIA')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<StateFilter {...defaultProps} disabled={true} />)

    const select = screen.getByRole('combobox')
    expect(select).toBeDisabled()
  })

  it('should show abbreviation when showAbbreviation is true', () => {
    render(<StateFilter {...defaultProps} showAbbreviation={true} />)

    expect(screen.getByText(/\(CA\)/)).toBeInTheDocument()
    expect(screen.getByText(/\(TX\)/)).toBeInTheDocument()
  })

  it('should hide abbreviation when showAbbreviation is false', () => {
    render(<StateFilter {...defaultProps} showAbbreviation={false} />)

    expect(screen.queryByText(/\(CA\)/)).not.toBeInTheDocument()
  })

  it('should apply size classes correctly', () => {
    const { rerender } = render(<StateFilter {...defaultProps} size="small" />)
    let select = screen.getByRole('combobox')
    expect(select.className).toContain('text-sm')

    rerender(<StateFilter {...defaultProps} size="large" />)
    select = screen.getByRole('combobox')
    expect(select.className).toContain('text-lg')
  })

  it('should hide all option when includeAllOption is false', () => {
    render(
      <StateFilter
        {...defaultProps}
        includeAllOption={false}
        placeholder="Pick one"
      />
    )

    const select = screen.getByRole('combobox')
    // Should only have 50 options (no placeholder)
    expect(select.querySelectorAll('option').length).toBe(50)
  })

  it('should sort states alphabetically', () => {
    render(<StateFilter {...defaultProps} />)

    const options = screen.getAllByRole('option')
    // Skip first option (placeholder), then check first few states
    const stateOptions = options.slice(1)

    // Alabama should be first alphabetically
    expect(stateOptions[0].textContent).toContain('Alabama')
    // Wyoming should be last
    expect(stateOptions[stateOptions.length - 1].textContent).toContain('Wyoming')
  })

  it('should apply custom className', () => {
    render(<StateFilter {...defaultProps} className="custom-class" />)

    const select = screen.getByRole('combobox')
    expect(select.className).toContain('custom-class')
  })
})
