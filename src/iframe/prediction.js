import { fetchy, query, Sorter } from 'common';

export const documents = async ({ url, ref, track, location }) => {
  const data = await fetchy({
    url: `/toolbar/predict?${query({ url, ref, track })}`,
  }).then(res => res.documents.map(normalizeDocument));

  return (
    new Sorter(data)
      // .max(a => a.occurences) // No use case
      // .fuzzy(a => `${a.title} ${a.summary}`, text) // Sometimes wrong
      .max(a => a.updated)
      .min(a => a.urls.length)
      .min(a => a.queryTotal)
      .is(a => a.singleton)
      .min(a => a.priority)
      .is(a => location.search.match(a.slug))
      .is(a => location.hash.match(a.slug))
      .is(a => location.pathname.match(a.slug))
      .compute()
  );
};

// window.location.origin
const normalizeDocument = doc => ({
  ...doc,
  url: window.location.origin + doc.url,
  status: (
    doc.url.includes('c=unclassified') ? 'draft' :
    doc.url.includes('c=release') ? 'release' :
    doc.url.includes('c=variation') ? 'experiment' :
    null
  ),
})