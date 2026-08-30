import type { RawSignal, SourceSubscription } from '../../../shared/domain.js'

export type CollectionResult = {
  subscription: SourceSubscription
  signals: RawSignal[]
  changed: boolean
}
