import { HourglassMediumIcon } from '@phosphor-icons/react'
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Feed } from '@/components/Feed'
import { SeeLaterDialog, useSeeLaterReturn } from '@/components/SeeLaterDialog'
import { CONTENT, createTitle } from '@/constants'
import type { Bookmark } from '@/types/db'
import { apiParameters } from '@/utils/fetching/apiParameters'
import { getBookmarksInfiniteOptions } from '@/utils/fetching/bookmarks'

export const Route = createFileRoute('/_app/see-later')({
  component: Page,
  head: () => ({
    meta: [
      {
        title: createTitle('seeLaterTitle'),
      },
    ],
  }),
  loaderDeps: ({ search }) => ({ search }),
  validateSearch: (search: Record<string, unknown>) => {
    const { offset: _, ...params } = apiParameters(search)
    return params
  },
})

function Page() {
  const search = useSearch({ from: '/_app/see-later' })
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(
      getBookmarksInfiniteOptions({ ...search, see_later: true }),
    )

  const items = data.pages.flatMap((page) => page.data ?? []) as Bookmark[]
  const count = data.pages[0]?.count ?? 0
  const { clear, handleLinkClick, returned } = useSeeLaterReturn(items)

  return (
    // Capture link clicks to know which bookmark was opened
    <div onClickCapture={handleLinkClick} onAuxClickCapture={handleLinkClick}>
      <Feed
        items={items}
        count={count}
        limit={search.limit}
        allowGroupByDate={true}
        title={CONTENT.seeLaterTitle}
        icon={<HourglassMediumIcon weight="duotone" size={24} />}
        feedType="bookmarks"
        from="/see-later"
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />
      <SeeLaterDialog bookmark={returned} onClose={clear} />
    </div>
  )
}
