import { render, screen } from '@testing-library/react'
import { ThemeToggle } from '@/components/ThemeToggle'
import ThemeProvider from '@/components/ThemeProvider'

const renderWithThemeProvider = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('ThemeToggle', () => {
  it('renders without crashing', () => {
    renderWithThemeProvider(<ThemeToggle />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('has correct aria-label', () => {
    renderWithThemeProvider(<ThemeToggle />)
    expect(screen.getByLabelText(/switch to/i)).toBeInTheDocument()
  })
})