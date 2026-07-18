import { describe, expect, it } from 'vitest'
import { zodTextFormat } from 'openai/helpers/zod'
import { opportunityAnalysisSchema } from '../../shared/domain'

describe('OpenAI structured output contracts', () => {
  it('keeps persistence-only optional fields out of model output', () => {
    expect(() => zodTextFormat(opportunityAnalysisSchema, 'opportunity_analysis')).not.toThrow()
    const format = zodTextFormat(opportunityAnalysisSchema, 'opportunity_analysis')

    expect(format.schema.properties).not.toHaveProperty('candidateId')
  })
})
