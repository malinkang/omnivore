import { getRepository } from '../entity/utils'
import { Speech, SpeechState } from '../entity/speech'
import { searchPages } from '../elastic/pages'
import { Page } from '../elastic/types'
import { SortBy, SortOrder } from '../utils/search'

export const setSpeechFailure = async (id: string) => {
  // update state
  await getRepository(Speech).update(id, {
    state: SpeechState.FAILED,
  })
}

/*
 * We should not transcribe the page when:
 ** 1. User has no recent listens the last 30 days
 ** 2. User has a recent listen but the page was saved after the listen
 */
export const shouldTranscribe = async (
  userId: string,
  page: Page
): Promise<boolean> => {
  const [recentListenedPage, count] = (await searchPages(
    {
      dateFilters: [
        {
          field: 'listenedAt',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      ],
      sort: {
        by: SortBy.LISTENED,
        order: SortOrder.DESCENDING,
      },
      size: 1,
    },
    userId
  )) || [[], 0]
  if (count === 0) {
    return false
  }
  return (
    !!recentListenedPage[0].listenedAt &&
    page.savedAt < recentListenedPage[0].listenedAt
  )
}
