import memoizeOne from 'memoize-one'

export const simpleUrl = memoizeOne(
  (url: string, withPath?: boolean): string => {
    // The form accepts any text as a URL, so show it as it is when it does
    // not parse rather than break the bookmark's rendering
    if (!URL.canParse(url)) {
      return url
    }

    const newUrl = new URL(url)
    const hostname = newUrl.hostname?.replace('www.', '')
    return withPath ? `${hostname}${newUrl.pathname}` : hostname
  },
)
