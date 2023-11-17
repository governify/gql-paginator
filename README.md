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
import { GQLPaginator } from 'github-gql-paginator';
```
---
## Usage
### GQLPaginator function
This async function receives a query, a token, and a configuration, and returns the paginated result if possible or the non-paged result if not. [Result's examples](https://github.com/governify/gql-paginator/tree/main#examples)
```
result = await GQLPaginator(query, token, configuration);
```
Parameters:
-  **Query**: Add the query you need to paginate, and put it in quotes. Remember that to paginate you need to build a query that provides the information necessary to do so. [How to build a valid query for pagination?](https://github.com/governify/gql-paginator/tree/main#how-to-build-a-valid-query-for-pagination)
-  **Token**: Your API token in quotes. You can find more information on how to generate a token on the page of the API you are using.
-  **Configuration**: The required pagination configuration of the API in use. You can also create your own configuration or modify existing ones by following the [configuration creation and editing guide](https://github.com/governify/gql-paginator/tree/main#configuration-creation-and-extend-guide). Default configurations:
    - github-v1.0.0
    - zenhub-v1.0.0
 ---
## Query and Configuration
### How to build a valid query for pagination?
In order for pagination to be carried out, it is necessary to follow a series of rules when building the query ([example](https://github.com/governify/gql-paginator/tree/main#examples)), which are listed below:
- All pageable types must contains:
```txt
  nodes {
    id
  }
  pageInfo {
    hasNextPage
    endCursor
  }  
  totalCount
```

- Query mustn't contains:
    - **after**

### Configuration creation and extend guide
The configuration chosen when calling the GQLPaginator function defines certain parameters that are necessary to know in order to paginate a result. This is due to the variability of GraphQL when generating subqueries. This section explains how to modify existing configurations or create a new one for an unsupported API.

### Creating a configuration
(This requires studying how the GraphQL API you are using works)
1. Go to your repository from opening the path node_modules/gql-paginator/configurations/sources
2. Create a new configuration called: "api-name"-v1.0.0.json
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

Obtained result:
```json
{
  "data": {
    "repository": {
      "issues": {
        "totalCount": 52,
        "pageInfo": {
          "hasNextPage": true,
          "endCursor": "Y3Vyc29yOnYyOpHOYHBmyA=="
        },
        "nodes": [
          {
            "id": "I_kwDOI8VKA85e5OIH",
            "title": "Task #2.6 Technical report and task diagram"
          },
          {
            "id": "I_kwDOI8VKA85e5O3A",
            "title": "Task #2.7 Methodologies management report"
          },
          {
            "id": "I_kwDOI8VKA85e5QOJ",
            "title": "Task #2.8 a) Pet hotel functionality"
          },
          {
            "id": "I_kwDOI8VKA85e5Qt7",
            "title": "Task #2.8 b) Web style"
          },
          {
            "id": "I_kwDOI8VKA85e5RDZ",
            "title": "Task #2.8 c) Add and edit veterinarians"
          },
          ...
```

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

Obtained result: 
```json
{
  "data": {
    "workspace": {
      "repositoriesConnection": {
        "nodes": [
          {
            "id": "Z2lkOi8vcmFwdG9yL1JlcG9zaXRvcnkvMTMzMzk2MDE4",
            "ghId": 600132099,
            "name": "psg2-2223-g6-63",
            "issues": {
              "pageInfo": {
                "hasNextPage": true,
                "endCursor": "WzI2MjAyMDU4NV0"
              },
              "totalCount": 76,
              "nodes": [
                {
                  "id": "Z2lkOi8vcmFwdG9yL0lzc3VlLzI2MDg0ODA4NA",
                  "title": "Task #2.9 Deployment",
                  "timelineItems": {
                    "pageInfo": {
                      "hasNextPage": false,
                      "endCursor": "MQ"
                    },
                    "totalCount": 1,
                    "nodes": [
                      {
                        "id": "Z2lkOi8vcmFwdG9yL1RpbWVsaW5lSXRlbTo6SXNzdWVFc3RpbWF0ZUNoYW5nZWQvMTExNTc0MDA3",
                        "data": {
                          "github_user": {
                            "id": 313464417,
                            "gh_id": 100673872,
                            "login": "JaviFdez7",
                            "avatar_url": "https://avatars.githubusercontent.com/u/100673872?v=4"
                          },
                          "current_value": "2.0"
                        },
                        "key": "issue.set_estimate",
                        "updatedAt": "2023-03-20T01:17:30Z"
                      }
                    ]
                  }
                },
                {
                  "id": "Z2lkOi8vcmFwdG9yL0lzc3VlLzI2MDg0ODA4Ng",
                  "title": "Task #2.6 Technical report and task diagram",
                  "timelineItems": {
                    "pageInfo": {
                      "hasNextPage": false,
                      "endCursor": "MQ"
                    },
                    "totalCount": 1,
                    "nodes": [
                      {
                        "id": "Z2lkOi8vcmFwdG9yL1RpbWVsaW5lSXRlbTo6SXNzdWVFc3RpbWF0ZUNoYW5nZWQvMTExMzk1NDM0",
                        "data": {
                          "github_user": {
                            "id": 313464417,
                            "gh_id": 100673872,
                            "login": "JaviFdez7",
                            "avatar_url": "https://avatars.githubusercontent.com/u/100673872?v=4"
                          },
                          "current_value": "8.0"
                        },
                        "key": "issue.set_estimate",
                        "updatedAt": "2023-03-15T15:41:06Z"
                      }
                    ]
                  }
                },
                ...
```
---

## Design and architecture
The GQLPaginator function is a recursive function that follows the following flow:

![gql-paginator-arquitecture (1)](https://github.com/governify/gql-paginator/assets/100673872/63e35411-4910-45f6-9927-d66287e02703)

Assumptions: 
- Arrays only exist in nodes, an array is not contemplated elsewhere.
- When an object has nodes as a property, it is considered a pageable type.
- Pageable types are not contemplated in a simple type.

