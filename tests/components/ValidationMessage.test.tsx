import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ValidationMessage from '../../components/ValidationMessage';

describe('ValidationMessage', () => {
  it('deve renderizar mensagem de erro', () => {
    render(
      <ValidationMessage
        error="Campo obrigatório"
        itemId="item1"
      />
    );

    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('não deve renderizar quando não há erro', () => {
    const { container } = render(
      <ValidationMessage
        error={undefined}
        itemId="item1"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('deve ter role alert para leitores de tela', () => {
    render(
      <ValidationMessage
        error="Erro de validação"
        itemId="item1"
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });
});

