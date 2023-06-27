const getInitialToken = async (akeneoClient, clientId, clientSecret, username, password) => {
  const initialAuthRequestBasicAuthValue = btoa(`${clientId}:${clientSecret}`)
  const initialAuthRequestBody = {
    method: 'POST',
    url: '/api/oauth/v1/token',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${initialAuthRequestBasicAuthValue}`
    },
    data: JSON.stringify({
      username,
      password,
      grant_type: 'password'
    })
  }
  const initialAuthRequest = await akeneoClient(initialAuthRequestBody)
  return initialAuthRequest.data
}

const getAll = async (akeneoClient, initialPath) => {
  console.log(`Beginning to paginate off of ${initialPath}`)
  const allItems = []
  let nextPageOfItems = initialPath
  while (nextPageOfItems) {
    const { data } = await akeneoClient.get(nextPageOfItems)
    allItems.push(...data._embedded.items)
    nextPageOfItems = data._links.next?.href
    console.log(`\t${allItems.length} items gathered`)
  }
  console.log(`Gathered total of ${allItems.length}`)
  return allItems
}

module.exports = {
  getAll,
  getInitialToken
}
