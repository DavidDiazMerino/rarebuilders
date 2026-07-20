import { describe, expect, it } from 'vitest'
import { demoProfile } from '../data/fixtures'
import { compactProjectSourceLabel, mergeBuilderMemory } from './builder-memory'

describe('builder memory imports', () => {
  it('keeps imported projects and their GitHub source in one atomic profile update', () => {
    const importedAt = '2026-07-17T12:00:00.000Z'
    const updated = mergeBuilderMemory(demoProfile, {
      projects: [{
        id: 'rarebuilders-import',
        name: 'RareBuilders',
        summary: 'Personal opportunity intelligence.',
        domains: ['work-productivity'],
        technologies: ['React'],
        status: 'prototype',
        reusableAssets: ['Opportunity scoring'],
        sourceLabel: 'GitHub README',
        sourceUrl: 'https://github.com/example/rarebuilders',
      }],
      fastSkills: ['opportunity scoring'],
      domains: ['work-productivity'],
      wildcardDomains: ['civic-tech'],
      noGoDomains: ['generic-devops'],
      technologies: ['Vercel'],
      repositories: [{
        fullName: 'example/rarebuilders',
        url: 'https://github.com/example/rarebuilders',
        description: 'Personal opportunity intelligence.',
        language: 'TypeScript',
        importedAt,
      }],
    })

    expect(updated.projects.some((project) => project.name === 'RareBuilders')).toBe(true)
    expect(updated.connectedGithubRepositories).toEqual([
      expect.objectContaining({ fullName: 'example/rarebuilders', importedAt }),
    ])
    expect(updated.fastSkills).toContain('opportunity scoring')
    expect(updated.domains).toContain('work-productivity')
    expect(updated.wildcardDomains).toContain('civic-tech')
    expect(updated.noGoDomains).toContain('generic-devops')
    expect(updated.technologiesToExplore).toContain('Vercel')
  })

  it('keeps inventory provenance compact and recognizable', () => {
    expect(compactProjectSourceLabel({
      sourceLabel: 'Public GitHub repository README; repository described as a private migration backup',
      sourceUrl: 'https://github.com/example/cashfromchaos',
    })).toBe('Public GitHub repository')

    expect(compactProjectSourceLabel({
      sourceLabel: 'Local README',
    })).toBe('Local README')
  })
})
