import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'
import { AppStateProvider } from './state/AppState'

describe('core demo journey', () => {
  it('enters the populated radar from the landing page', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /find the one where you have an edge/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /explore david’s radar/i }))

    expect(await screen.findByRole('heading', { name: /five opportunities worth your attention/i })).toBeInTheDocument()
    expect(screen.getAllByText(/practical|rare|wildcard/i).length).toBeGreaterThan(0)
  })
})
