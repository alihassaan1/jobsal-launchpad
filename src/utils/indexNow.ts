/**
 * IndexNow Integration for Search Engine Indexing
 * Notifies search engines (Bing, Yandex, etc.) of content updates
 */

const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
];

// IndexNow API key from Bing Webmaster Tools
const INDEXNOW_KEY = 'ae69c2bfc62b455f9c9f1835b5ac084f';

interface IndexNowParams {
  url: string | string[];
  host?: string;
}

export const notifySearchEngines = async ({ url, host = 'jobs.al' }: IndexNowParams): Promise<void> => {
  const urls = Array.isArray(url) ? url : [url];
  
  const payload = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`,
    urlList: urls.map(u => u.startsWith('http') ? u : `https://${host}${u}`)
  };

  try {
    // Notify all search engines
    const requests = INDEXNOW_ENDPOINTS.map(endpoint =>
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(payload)
      }).catch(err => {
        console.warn(`IndexNow notification failed for ${endpoint}:`, err);
        return null;
      })
    );

    await Promise.allSettled(requests);
    console.log('IndexNow notifications sent for:', urls);
  } catch (error) {
    console.error('Failed to send IndexNow notifications:', error);
  }
};

/**
 * Notify search engines when new job is posted
 */
export const notifyJobPosted = (jobSlug: string) => {
  return notifySearchEngines({
    url: `/jobs/${jobSlug}`
  });
};

/**
 * Notify search engines when blog post is published
 */
export const notifyBlogPublished = (postSlug: string) => {
  return notifySearchEngines({
    url: `/blog/${postSlug}`
  });
};

/**
 * Notify search engines when company profile is updated
 */
export const notifyCompanyUpdated = (companySlug: string) => {
  return notifySearchEngines({
    url: `/companies/${companySlug}`
  });
};

/**
 * Batch notify for multiple URLs
 */
export const notifyBatch = (urls: string[]) => {
  return notifySearchEngines({
    url: urls
  });
};
