import { useSuspenseQuery } from '@tanstack/react-query'
import {
  createFileRoute,
  Outlet,
  useMatchRoute,
  useSearch,
} from '@tanstack/react-router'
import { Suspense } from 'react'
import { BookmarkForm } from '@/components/BookmarkForm'
import { Loader } from '@/components/Loader'
import { createTitle } from '@/constants'
import { extractUrl } from '@/utils/extractUrl'
import { getMetaOptions } from '@/utils/fetching/meta'

export const Route = createFileRoute('/_app/new/bookmark')({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: createTitle('newBookmarkTitle'),
      },
    ],
  }),
  loader: async (opts) => {
    const tags = await opts.context.queryClient.ensureQueryData(
      getMetaOptions(),
    )
    const response = { tags }
    return response
  },
  loaderDeps: ({ search }) => ({
    bookmarklet: search.bookmarklet,
    url: search.url,
  }),
  // Android's share menu (manifest.json share_target) sends title, text and
  // url; many apps leave url empty and put the link in the text
  validateSearch: (search: {
    url?: string
    bookmarklet?: string
    text?: string
    title?: string
  }): { url?: string; bookmarklet?: string } => {
    return {
      bookmarklet: search.bookmarklet,
      url: search.url || extractUrl(search.text) || extractUrl(search.title),
    }
  },
})

function RouteComponent() {
  const matchRoute = useMatchRoute()
  const isConfirmationRoute = Boolean(
    matchRoute({ to: '/new/bookmark/confirmation' }),
  )
  const searchParams = useSearch({ from: '/_app/new/bookmark' })
  const { data } = useSuspenseQuery(getMetaOptions())

  if (isConfirmationRoute) {
    return <Outlet />
  }

  return (
    <Suspense fallback={<Loader />}>
      <BookmarkForm
        type="new"
        initialValues={{
          url: searchParams.url,
        }}
        tags={data?.tags}
      />
    </Suspense>
  )
}
