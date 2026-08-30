import type { SourcePack, SourceSubscription } from './domain.js'

const subscription = (
  input: Omit<SourceSubscription, 'scope' | 'privacy' | 'cadence' | 'languages' | 'enabled'>,
): SourceSubscription => ({
  ...input,
  scope: { type: 'global' },
  privacy: 'public',
  cadence: 'twice-weekly',
  languages: ['English', 'Spanish'],
  enabled: true,
})

export const sourcePacks: SourcePack[] = [
  {
    id: 'agent-infrastructure',
    label: 'Agents & AI infrastructure',
    description: 'Agent tooling, developer infrastructure, model integrations and AI builder calls.',
    wildcard: false,
    subscriptions: [
      subscription({ id: 'agents-github', adapterId: 'github', sourcePackId: 'agent-infrastructure', label: 'Agent bounties on GitHub', kind: 'search', query: 'AI agent developer tools', trust: 72, positiveTerms: ['bounty', 'reward', 'grant', 'challenge'], negativeTerms: ['weekly update'] }),
      subscription({ id: 'agents-devpost', adapterId: 'devpost', sourcePackId: 'agent-infrastructure', label: 'Agent challenges on Devpost', kind: 'search', query: 'AI agents developer tools', trust: 68, positiveTerms: ['prize', 'submission', 'hackathon'], negativeTerms: [] }),
    ],
  },
  {
    id: 'sports-vision',
    label: 'Football, vision & sports analytics',
    description: 'Tracking, eventing, computer vision and sports data challenges.',
    wildcard: false,
    subscriptions: [
      subscription({ id: 'sports-kaggle', adapterId: 'kaggle', sourcePackId: 'sports-vision', label: 'Sports and vision competitions', kind: 'search', query: 'sports computer vision tracking', trust: 74, positiveTerms: ['competition', 'prize', 'deadline'], negativeTerms: [] }),
      subscription({ id: 'sports-github', adapterId: 'github', sourcePackId: 'sports-vision', label: 'Sports and vision bounties', kind: 'search', query: 'football sports computer vision', trust: 70, positiveTerms: ['bounty', 'reward', 'challenge'], negativeTerms: [] }),
      subscription({ id: 'sports-soccernet', adapterId: 'page-monitor', sourcePackId: 'sports-vision', label: 'SoccerNet challenges', kind: 'page', endpoint: 'https://www.soccer-net.org/challenges', trust: 92, positiveTerms: ['challenge', 'submission', 'deadline'], negativeTerms: ['past challenge'] }),
    ],
  },
  {
    id: 'creative-publishing',
    label: 'Video, creativity & publishing',
    description: 'Creative technology, video, storytelling, publishing and creator programmes.',
    wildcard: false,
    subscriptions: [
      subscription({ id: 'creative-devpost', adapterId: 'devpost', sourcePackId: 'creative-publishing', label: 'Creative technology challenges', kind: 'search', query: 'creative technology video publishing', trust: 67, positiveTerms: ['prize', 'submission', 'challenge'], negativeTerms: [] }),
      subscription({ id: 'creative-eu', adapterId: 'eu', sourcePackId: 'creative-publishing', label: 'Creative Europe calls', kind: 'search', query: 'creative media culture publishing', trust: 90, positiveTerms: ['call', 'funding', 'deadline'], negativeTerms: [] }),
    ],
  },
  {
    id: 'hardware-robotics',
    label: 'Hardware, robotics & DGX',
    description: 'Hardware kits, robotics, edge AI and maker competitions.',
    wildcard: false,
    subscriptions: [
      subscription({ id: 'hardware-devpost', adapterId: 'devpost', sourcePackId: 'hardware-robotics', label: 'Hardware challenges', kind: 'search', query: 'robotics hardware edge AI', trust: 68, positiveTerms: ['hardware', 'kit', 'prize', 'submission'], negativeTerms: [] }),
      subscription({ id: 'hardware-hackster', adapterId: 'page-monitor', sourcePackId: 'hardware-robotics', label: 'Hackster contests', kind: 'page', endpoint: 'https://www.hackster.io/contests', trust: 82, positiveTerms: ['contest', 'prize', 'deadline', 'hardware'], negativeTerms: ['ended'] }),
      subscription({ id: 'hardware-printables', adapterId: 'page-monitor', sourcePackId: 'hardware-robotics', label: 'Printables contests', kind: 'page', endpoint: 'https://www.printables.com/contest', trust: 78, positiveTerms: ['contest', 'prize', 'ends'], negativeTerms: ['ended'] }),
    ],
  },
  {
    id: 'science-wildcard',
    label: 'Science wildcard',
    description: 'Biology, health and computational science opportunities outside the usual lane.',
    wildcard: true,
    subscriptions: [
      subscription({ id: 'science-kaggle', adapterId: 'kaggle', sourcePackId: 'science-wildcard', label: 'Life science competitions', kind: 'search', query: 'biology health science', trust: 74, positiveTerms: ['competition', 'prize', 'deadline'], negativeTerms: [] }),
      subscription({ id: 'science-eu', adapterId: 'eu', sourcePackId: 'science-wildcard', label: 'European science calls', kind: 'search', query: 'health biotechnology computational science', trust: 90, positiveTerms: ['call', 'grant', 'funding', 'deadline'], negativeTerms: [] }),
    ],
  },
]

export const sourcePackById = new Map(sourcePacks.map((pack) => [pack.id, pack]))

export function activeSubscriptions(enabledPackIds: string[]) {
  const enabled = new Set(enabledPackIds)
  return sourcePacks
    .filter((pack) => enabled.has(pack.id))
    .flatMap((pack) => pack.subscriptions)
    .filter((source) => source.enabled)
}
