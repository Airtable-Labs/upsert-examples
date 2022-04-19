// Recursive function to paginate through all matching (parent) messages in a conversation
const getMessages = async function (client, apiMethod, params, data = []) {
  console.log(`Querying ${apiMethod} with ${JSON.stringify(params)}; already have ${data.length} in array`)

  return client.conversations
    .history(params)
    .then(response => {
      data.push(...response.messages)
      if (response.has_more === false) return data
      return getFullConvoHistory(
        client,
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

