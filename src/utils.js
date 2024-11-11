const axios = require('axios');

module.exports = { requestQuery };

async function requestQuery(query, apiUrl, token) {
    const requestConfig = {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    };

    try {
      const result = await axios.post(apiUrl, { query }, requestConfig);

      if (result.status === 200) {
        const responseData = result.data;

        if (!responseData) {
          throw new Error(`Error in the api request (${apiUrl}): Repository not found`);
        }

        const repositoryJSON = JSON.stringify(responseData);

        return repositoryJSON;
      } else {
        throw new Error(`Error in the api request (${apiUrl}): ${result.status}`);
      }
    } catch (error) {
      throw new Error(`Error in the api request (${apiUrl}): your query, apiUrl or token are wrong`);
    }
  }


  