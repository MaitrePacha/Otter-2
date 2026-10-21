const URL_PATTERN = /https?:\/\/[^\s<>"']+/i
// Punctuation that ends a sentence rather than the link
const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/

/**
 * The first http(s) link in a piece of text. Apps sharing to Otter often put
 * the link inside the shared text instead of the url field.
 */
export const extractUrl = (text?: string): string | undefined => {
  const match = text?.match(URL_PATTERN)?.[0]

  return match?.replace(TRAILING_PUNCTUATION, '') || undefined
}
