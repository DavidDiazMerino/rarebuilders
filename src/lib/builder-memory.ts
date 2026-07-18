import type {
  BuilderProfile,
  ConnectedGithubRepository,
  ProjectAsset,
} from '../../shared/domain'

export type BuilderMemoryImport = {
  projects: ProjectAsset[]
  fastSkills: string[]
  domains: string[]
  wildcardDomains: string[]
  noGoDomains: string[]
  technologies: string[]
  repositories: ConnectedGithubRepository[]
}

export function mergeBuilderMemory(profile: BuilderProfile, input: BuilderMemoryImport): BuilderProfile {
  const byName = new Map(profile.projects.map((project) => [project.name.toLowerCase(), project]))
  for (const project of input.projects) byName.set(project.name.toLowerCase(), project)

  const byRepository = new Map(
    profile.connectedGithubRepositories.map((repository) => [repository.fullName.toLowerCase(), repository]),
  )
  for (const repository of input.repositories) {
    byRepository.set(repository.fullName.toLowerCase(), repository)
  }

  return {
    ...profile,
    projects: [...byName.values()],
    fastSkills: [...new Set([...profile.fastSkills, ...input.fastSkills])],
    domains: [...new Set([...profile.domains, ...input.domains])],
    wildcardDomains: [...new Set([...profile.wildcardDomains, ...input.wildcardDomains])],
    noGoDomains: [...new Set([...profile.noGoDomains, ...input.noGoDomains])],
    technologiesToExplore: [...new Set([...profile.technologiesToExplore, ...input.technologies])],
    connectedGithubRepositories: [...byRepository.values()],
  }
}
