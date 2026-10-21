import { HashIcon } from '@phosphor-icons/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getCollectionsTagsOptions } from '@/utils/fetching/collections'
import { getTagsOptions } from '@/utils/fetching/tags'

/**
 * The collection's tags as filters: each one toggles itself in the page's
 * `tags` search param instead of leaving for the tag page
 */
export const useCollectionsSubNav = (
  collection: string,
  activeTags: string[] = [],
) => {
  const { data: dbMetaTags } = useSuspenseQuery(getTagsOptions())
  const { data: collectionTags } = useSuspenseQuery(getCollectionsTagsOptions())

  const subNav = useMemo(() => {
    const matchingCollection =
      collectionTags?.filter((item) => {
        return item?.collection?.toLowerCase() === collection.toLowerCase()
      }) || []
    const matchingMetaTag = dbMetaTags?.find((item) => {
      return item?.tag?.toLowerCase() === collection.toLowerCase()
    })
    const matchingCollectionTags = matchingCollection[0]?.tags || []
    const matchingTags = [matchingMetaTag?.tag, ...matchingCollectionTags]

    return matchingTags?.length
      ? matchingTags
          ?.filter((item) => typeof item === 'string')
          .map((item) => {
            const isActive = activeTags.includes(item)
            const tags = isActive
              ? activeTags.filter((tag) => tag !== item)
              : [...activeTags, item]

            return {
              href: `/collection/${encodeURIComponent(collection)}`,
              icon: <HashIcon weight="duotone" size={18} />,
              isActive,
              search: { tags: tags.length ? tags : undefined },
              text: item,
            }
          })
      : []
  }, [activeTags, collection, collectionTags, dbMetaTags])

  return subNav
}
