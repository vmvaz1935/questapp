import { describe, it, expect } from 'vitest';
import { calculateQuestionnaireScore, validateItem, validateAnswers } from '../../utils/scoringEngine';
import { Questionnaire, Item } from '../../types';

describe('scoringEngine', () => {
  describe('validateItem', () => {
    it('deve validar item simples sem resposta', () => {
      const item: Item = {
        id: 'item1',
        text: 'Teste',
        domain: 'Test',
        options: [
          { label: 'Opção 1', score: 0 },
          { label: 'Opção 2', score: 1 },
        ],
        reverse_scored: false,
      };

      const result = validateItem(item, {});
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('deve validar item simples com resposta', () => {
      const item: Item = {
        id: 'item1',
        text: 'Teste',
        domain: 'Test',
        options: [
          { label: 'Opção 1', score: 0 },
          { label: 'Opção 2', score: 1 },
        ],
        reverse_scored: false,
      };

      const result = validateItem(item, { item1: 1 });
      expect(result.valid).toBe(true);
    });

    it('deve validar item com subitems', () => {
      const item: Item = {
        id: 'item1',
        text: 'Teste',
        domain: 'Test',
        options: [],
        reverse_scored: false,
        subitems: [
          {
            id: 'sub1',
            text: 'Subitem 1',
            options: [{ label: 'Opção 1', score: 0 }],
          },
          {
            id: 'sub2',
            text: 'Subitem 2',
            options: [{ label: 'Opção 1', score: 0 }],
            not_scored: true,
          },
        ],
      };

      const result1 = validateItem(item, {});
      expect(result1.valid).toBe(false);

      const result2 = validateItem(item, { sub1: 0 });
      expect(result2.valid).toBe(true);
    });
  });

  describe('validateAnswers', () => {
    it('deve identificar itens faltantes', () => {
      const questionnaire: Questionnaire = {
        id: 'test',
        name: 'Test',
        acronym: 'TST',
        domain: 'Test',
        instructions: { text: 'Test', reproduction_permitted: true },
        items: [
          {
            id: 'item1',
            text: 'Item 1',
            domain: 'Test',
            options: [{ label: 'Opção 1', score: 0 }],
            reverse_scored: false,
          },
          {
            id: 'item2',
            text: 'Item 2',
            domain: 'Test',
            options: [{ label: 'Opção 1', score: 0 }],
            reverse_scored: false,
          },
        ],
        scoring: {
          domains: [],
          total_formula: 'Soma de todos os itens',
          missing_data_rule: 'Não permitir',
          range: { min: 0, max: 100 },
          interpretation: 'Test',
        },
        source: { filename: 'test.json' },
      };

      const result = validateAnswers(questionnaire, { item1: 0 });
      expect(result.valid).toBe(false);
      expect(result.missingItems).toContain('item2');
    });
  });

  describe('calculateQuestionnaireScore', () => {
    it('deve calcular score básico', () => {
      const questionnaire: Questionnaire = {
        id: 'test',
        name: 'Test',
        acronym: 'TST',
        domain: 'Test',
        instructions: { text: 'Test', reproduction_permitted: true },
        items: [
          {
            id: 'item1',
            text: 'Item 1',
            domain: 'Test',
            options: [
              { label: 'Opção 1', score: 0 },
              { label: 'Opção 2', score: 1 },
              { label: 'Opção 3', score: 2 },
            ],
            reverse_scored: false,
          },
          {
            id: 'item2',
            text: 'Item 2',
            domain: 'Test',
            options: [
              { label: 'Opção 1', score: 0 },
              { label: 'Opção 2', score: 1 },
            ],
            reverse_scored: false,
          },
        ],
        scoring: {
          domains: [],
          total_formula: 'Soma de todos os itens',
          missing_data_rule: 'Não permitir',
          range: { min: 0, max: 100 },
          interpretation: 'Test',
        },
        source: { filename: 'test.json' },
      };

      const result = calculateQuestionnaireScore(questionnaire, {
        item1: 2,
        item2: 1,
      });

      expect(result.totalScore).toBe(3);
      expect(result.error).toBeUndefined();
    });

    it('deve aplicar reverse scoring quando necessário', () => {
      const questionnaire: Questionnaire = {
        id: 'test',
        name: 'Test',
        acronym: 'TST',
        domain: 'Test',
        instructions: { text: 'Test', reproduction_permitted: true },
        items: [
          {
            id: 'item1',
            text: 'Item 1',
            domain: 'Test',
            options: [
              { label: 'Opção 1', score: 0 },
              { label: 'Opção 2', score: 1 },
              { label: 'Opção 3', score: 2 },
            ],
            reverse_scored: true,
          },
        ],
        scoring: {
          domains: [],
          total_formula: 'Soma de todos os itens',
          missing_data_rule: 'Não permitir',
          range: { min: 0, max: 100 },
          interpretation: 'Test',
        },
        source: { filename: 'test.json' },
      };

      const result = calculateQuestionnaireScore(questionnaire, {
        item1: 0, // Score 0 deve virar 2 (max - score)
      });

      expect(result.totalScore).toBe(2);
    });
  });
});
