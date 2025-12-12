import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AutosaveIndicator from '../../components/AutosaveIndicator';

describe('AutosaveIndicator', () => {
  it('deve renderizar estado de salvando', () => {
    render(
      <AutosaveIndicator
        status="saving"
        lastSaved={null}
      />
    );

    expect(screen.getByText('Salvando...')).toBeInTheDocument();
  });

  it('deve renderizar estado de salvo', () => {
    const lastSaved = new Date(Date.now() - 5000); // 5 segundos atrás
    
    render(
      <AutosaveIndicator
        status="saved"
        lastSaved={lastSaved}
      />
    );

    expect(screen.getByText(/Salvo há/)).toBeInTheDocument();
  });

  it('deve renderizar estado de erro', () => {
    const error = new Error('Erro ao salvar');
    
    render(
      <AutosaveIndicator
        status="error"
        lastSaved={null}
        error={error}
      />
    );

    expect(screen.getByText('Erro ao salvar')).toBeInTheDocument();
  });

  it('não deve renderizar nada no estado idle', () => {
    const { container } = render(
      <AutosaveIndicator
        status="idle"
        lastSaved={null}
      />
    );

    expect(container.firstChild?.textContent).toBe('');
  });
});

