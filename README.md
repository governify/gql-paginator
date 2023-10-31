# github-gql-paginator
This repository offers utilities and tools to streamline efficient pagination of GraphQL queries in applications using the GitHub API. It simplifies the management of paginated results and provides a ready-to-use solution for your GraphQL-based projects interacting with API data.

---
## Installation
1. Open the repository where you want to install the library
2. Run this command in a command console:
```
npm install gql-paginator
```
3. Import the library in the js file in which you want to use the functions:
```
import { GQLPaginator, visualizeAllAvailableConfigurationsSource } from 'github-gql-paginator';
```
---
## Usage
### GQLPaginator function
This async function receives a query, a token, and a configuration, and returns the paginated result if possible or the non-paged result if not.
```
await GQLPaginator(query, token, configuration);
```
Parameters:
-  **Query**: Add the query you need to paginate, and put it in quotes. Remember that to paginate you need to build a query that provides the information necessary to do so. [How to build a valid query for pagination?](https://github.com/governify/gql-paginator/tree/main#how-to-build-a-valid-query-for-pagination)
-  **Token**: Your API token in quotes. You can find more information on how to generate a token on the page of the API you are using.
-  **Configuration**: The required pagination configuration of the API in use. You can use the [visualizeAllAvailableConfigurationsSource](https://github.com/governify/gql-paginator/tree/main#visualizeallavailableconfigurationssource) function to view all available settings. You can also create your own configuration or modify existing ones by following the [configuration creation and editing guide](https://github.com/governify/gql-paginator/tree/main#configuration-creation-and-extend-guide). Default configurations:
    - github-v1.0.0
    - zenhub-v1.0.0
 ---
## Query and Configuration
### How to build a valid query for pagination?
In order for pagination to be carried out, it is necessary to follow a series of rules when building the query ([example](https://github.com/governify/gql-paginator/tree/main#examples)), which are listed below:
- All pageable types must contains:
  - **nodes**
    - **id**
  - **pageInfo**
    - **hasNextPage**
    - **endCursor**  
  - **totalCount**
- Query mustn't contains:
    - **after**

### Configuration creation and extend guide
The configuration chosen when calling the GQLPaginator function defines certain parameters that are necessary to know in order to paginate a result. This is due to the variability of GraphQL when generating subqueries. This section explains how to modify existing configurations or create a new one for an unsupported API.

### Creating a configuration
(This requires studying how the GraphQL API you are using works)
1. Go to your repository from opening the path node_modules/gql-paginator/configurations/sources
2. Create a new configuration called: <api-name>-v1.0.0.json
3. Use this template to create a new API configuration
```
{
    "id": "",
    "url": "",
    "complexSubqueryPath": , 
    "firstLevelPtype": [],
    "paths":{
    }
}
```
4. Fill out all the fields following the explanation below (It's recommended to compare what you fill in with the default configurations):
    - id: "api-name"-v1.0.0
    - url: api url.
    - complexSubqueryPath: if the subquery of your api is made following the github (PullRequestReview) structure then true, if they are made like zenhub (only Review) then false.
    - firstLevelPtype: if complexSubqueryPath is true then fill the array with only first level types.
    - paths: the paths of your query with the necessary value to generate a correct subquery.

### Extending a configuration
If you are using an existing configuration and you call the function with the correct parameters, but the configuration does not include the pageable object that you want to page, it will let you know through the logs in the console and describe the paths that you should add. 

**Example:**

I have this github-v1.0.0 configuration:
```
{
    "id": "github-v1.0.0",
    "url": "https://api.github.com/graphql",
    "complexSubqueryPath": true, 
    "firstLevelPtype": ["pullRequests","issues"],
    "paths":{
        "pullRequests.*": "PullRequest",
        "issues.*": "Issue"
    }
}
```

When I try to paginate my github query that you can find in the [examples](https://github.com/governify/gql-paginator/tree/main#examples), the console will return this error:

![2023-10-30 13_13_11-github-v1 0 0 json - github-gql-paginator - Visual Studio Code](https://github.com/governify/gql-paginator/assets/100673872/c4759a3e-dbeb-4f69-b309-61e13925f11d)

Solution: add the path in the specified json
```
{
    "id": "github-v1.0.0",
    "url": "https://api.github.com/graphql",
    "complexSubqueryPath": true, 
    "firstLevelPtype": ["pullRequests","issues"],
    "paths":{
        "pullRequests.*": "PullRequest",
        "issues.*": "Issue",
        "pullRequests.reviews.*": "PullRequestReview"
    }
}
```

 ---
## Examples
### github-v1.0.0
Change ${repository-name} and ${user-name} to the repository name that you are using and your user name. Change ${token} to your github token.
```
GQLPaginator(`{
  repository(name: "${repository-name}", owner:"${user-name}") {
    issues(first: 1) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
      }
    }
    pullRequests(first: 1) {
      totalCount
      pageInfo {
        endCursor
      }
      nodes {
        id
        state
        title
        body
        baseRefName
        headRefName
        createdAt
        author {
          login
        }
        mergedAt
        mergedBy {
          login
        }
        reviews(first: 1) {
          totalCount
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            createdAt
            state
            reactions (first: 1) {
              totalCount
              pageInfo {
                hasNextPage
                endCursor 
              }
              nodes {
                content
                id
                user{
                  name
                }
              }
            }
          }
        }
        assignees(first: 1){
          pageInfo {
            hasNextPage
            endCursor
          }
          totalCount
          nodes{
            id
            name
          }
        }
      }
    }
  }
}`, ${token}, 'github-v1.0.0')
```
If you look at the query, pullRequests (paginable type) does not have the hasNextPage attribute within pageInfo, which was a [mandatory requirement](https://github.com/governify/gql-paginator/tree/main#how-to-build-a-valid-query-for-pagination) to be able to paginate. Therefore, pullRequests will not be paged, but the rest of the pageable types will be. You can add hasNextPage attribute and you'll see how now the pagination is done in pullRequests.

### zenhub-v1.0.0
Change ${repository-id} to the repository name that you can find it in your board url:

![Captura de pantalla 2023-10-31 093835](https://github.com/governify/gql-paginator/assets/100673872/78fdbdaf-f10a-45f8-94a8-0cf3c4946744)

Change ${token} to your zenhub token.
```
GQLPaginator(`query {
  workspace(id: "${repository-id}") {
    repositoriesConnection(first: 10) {
      nodes {
        id
        ghId
        name
        issues(first:5){
           pageInfo{
            hasNextPage
            endCursor
           }
           totalCount
           nodes{
            id
            title
            timelineItems(first:10){
              pageInfo{
                hasNextPage
                endCursor
              }
              totalCount
              nodes{
                id
                data
                key
                updatedAt
              }
            }
          }
        }
        owner {
          login
        }
      }
    }
  }
}`, ${token}, 'zenhub-v1.0.0')
```
---
## Utils
### visualizeAllAvailableConfigurationsSource
Use this function to view the available library configurations.
```
console.log(visualizeAllAvailableConfigurationsSource());
```

## Design and architecture


