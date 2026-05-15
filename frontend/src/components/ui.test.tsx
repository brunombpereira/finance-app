import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Wallet } from 'lucide-react'
import { Button, EmptyState } from './ui'

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Guardar</Button>)
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Clica</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Clica' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled>
        Bloqueado
      </Button>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Bloqueado' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('EmptyState', () => {
  it('renders the title and hint', () => {
    render(<EmptyState title="Sem dados" hint="Adiciona o primeiro registo" icon={Wallet} />)
    expect(screen.getByText('Sem dados')).toBeInTheDocument()
    expect(screen.getByText('Adiciona o primeiro registo')).toBeInTheDocument()
  })

  it('renders an action when provided', () => {
    render(<EmptyState title="Vazio" action={<Button>Criar</Button>} />)
    expect(screen.getByRole('button', { name: 'Criar' })).toBeInTheDocument()
  })
})
