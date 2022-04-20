// Recursive function to paginate through all matching messages
//   tested values of apiMethod: 'conversations.history', 'conversations.replies'
const getMessages = async function (client, apiMethod, params, data = []) {
  console.log(`Querying ${apiMethod} with ${JSON.stringify(params)}; already have ${data.length} in array`)

  return client.apiCall(apiMethod, params)
    .then(response => {
      data.push(...response.messages)
      if (response.has_more === false) return data
      return getMessages(
        client,
        apiMethod,
        Object.assign(params, {
          cursor: response.response_metadata.next_cursor
        }),
        data
      )
    })
    .catch(err => {
      console.error(JSON.stringify(err))
    })
}

module.exports = {
  getMessages
}

