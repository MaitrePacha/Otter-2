import { FolderIcon } from '@phosphor-icons/react'
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Feed } from '@/components/Feed'
import { useCollectionsSubNav } from '@/hooks/useCollectionsSubNav'
import type { Bookmark } from '@/types/db'
import { apiParameters } from '@/utils/fetching/apiParameters'
import { getCollectionsInfiniteOptions } from '@/utils/fetching/collections'

export const Route = createFileRoute('/_app/collection/$collection')({
  component: Page,
  head: ({ params }) => ({
    meta: [
      {
        title: `Collection: ${params.collection}`,
      },
    ],
  }),
  loaderDeps: ({ search }) => ({ search }),
  validateSearch: (search: Record<string, unknown>) => {
    const { offset: _, ...params } = apiParameters(search)
    const tags = Array.isArray(search.tags)
      ? search.tags.filter((tag): tag is string => typeof tag === 'string')
      : undefined
    return { ...params, tags: tags?.length ? tags : undefined }
  },
})

function Page() {
  const collection = Route.useParams().collection
  const { tags, ...search } = useSearch({
    from: '/_app/collection/$collection',
  })
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(
      getCollectionsInfiniteOptions({
        name: collection,
        params: search,
        tags,
      }),
    )
  const subNav = useCollectionsSubNav(collection, tags)

  const items = data.pages.flatMap((page) => page.data ?? []) as Bookmark[]
  const count = data.pages[0]?.count ?? 0

  return (
    <Feed
      items={items}
      count={count}
      limit={search.limit}
      allowGroupByDate={true}
      title={collection}
      icon={<FolderIcon weight="duotone" size={24} />}
      feedType="bookmarks"
      subNav={subNav}
      from={`/collection/${encodeURIComponent(collection)}`}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      shareConfig={{ kind: 'collection', name: collection }}
    />
  )
}
