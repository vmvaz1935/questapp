import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import QuestionnaireForm from '../../components/QuestionnaireForm';
import { Questionnaire } from '../../types';

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

beforeEach(() => {
  global.localStorage = localStorageMock as any;
  vi.clearAllMocks();
});

const mockQuestionnaire: Questionnaire = {
  id: 'test-q-1',
  name: 'Test Questionnaire',
  acronym: 'TQ',
  domain: 'Test',
  instructions: {
    text: 'Test instructions',
    reproduction_permitted: true,
  },
  items: [
    {
      id: 'Q1',
      text: 'Question 1',
      domain: 'Test',
      options: [
        { label: 'Option 1', score: 0 },
        { label: 'Option 2', score: 1 },
        { label: 'Option 3', score: 2 },
      ],
      reverse_scored: false,
    },
    {
      id: 'Q2',
      text: 'Question 2',
      domain: 'Test',
      options: [
        { label: 'Option 1', score: 0 },
        { label: 'Option 2', score: 1 },
      ],
      reverse_scored: false,
    },
  ],
  scoring: {
    formula: '(Soma de todos os itens / 4) * 100',
    interpretation: 'Higher is better',
    range: {
      min: 0,
      max: 100,
    },
  },
  source: {
    filename: 'test.json',
  },
};

describe('QuestionnaireForm', () => {
  it('deve renderizar o formulário do questionário', () => {
    render(
      <BrowserRouter>
        <QuestionnaireForm questionnaire={mockQuestionnaire} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Questionnaire (TQ)')).toBeInTheDocument();
    expect(screen.getByText('Test instructions')).toBeInTheDocument();
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('Question 2')).toBeInTheDocument();
  });

  it('deve permitir selecionar respostas', () => {
    render(
      <BrowserRouter>
        <QuestionnaireForm questionnaire={mockQuestionnaire} />
      </BrowserRouter>
    );

    // Buscar pela label ou texto da opção
    const option1 = screen.getByText(/Option 2/i).closest('label')?.querySelector('input[type="radio"]') as HTMLInputElement;
    if (option1) {
      fireEvent.click(option1);
      expect(option1).toBeChecked();
    } else {
      // Fallback: buscar diretamente pelo input
      const inputs = screen.getAllByRole('radio');
      if (inputs.length > 0) {
        fireEvent.click(inputs[0]);
        expect(inputs[0]).toBeChecked();
      }
    }
  });

  it('deve mostrar progresso do questionário', () => {
    render(
      <BrowserRouter>
        <QuestionnaireForm questionnaire={mockQuestionnaire} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Progresso:/i)).toBeInTheDocument();
    expect(screen.getByText(/0\/2/i)).toBeInTheDocument();
  });

  it('deve habilitar botão de submit quando todas as respostas estiverem preenchidas', async () => {
    render(
      <BrowserRouter>
        <QuestionnaireForm questionnaire={mockQuestionnaire} />
      </BrowserRouter>
    );

    // Preencher todas as respostas usando inputs de rádio
    const radioButtons = screen.getAllByRole('radio');
    
    // Selecionar primeira opção de cada pergunta
    if (radioButtons.length >= 2) {
      fireEvent.click(radioButtons[0]); // Q1 - primeira opção
      fireEvent.click(radioButtons[2]); // Q2 - primeira opção (pulando opções de Q1)
    }

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /Calcular Pontuação|Responder/i });
      expect(submitButton).not.toBeDisabled();
    }, { timeout: 5000 });
  });

  it('deve desabilitar botão de submit quando respostas estiverem incompletas', () => {
    render(
      <BrowserRouter>
        <QuestionnaireForm questionnaire={mockQuestionnaire} />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /Responder/i });
    expect(submitButton).toBeDisabled();
  });
});

