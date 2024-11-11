module.exports = { resolve };

const { requestQuery } = require('../../utils.js'); 

const apiUrl = "https://api.github.com/graphql"

async function resolve(token, config) {
  const query = `{
  repository(owner: "${config.owner}", name: "${config.repository}") {
    projectsV2(first: 5) {  
      totalCount
      nodes {
        id
        items(first: 1) {
          totalCount
          pageInfo{
            hasNextPage
            endCursor
          }
          nodes {
            content {
              ... on Issue {
                title
                bodyText
                updatedAt
                assignees(first:10){
                  nodes{
                    login
                  }
                }
                createdAt
                number
                linkedBranches(first:10){
                  totalCount
                  nodes{
                    ref{
                      name
                    }
                  }
                }
                author {
                  login
                }
              }
            }
            fieldValues(first: 100) {
              nodes {
                ... on ProjectV2ItemFieldRepositoryValue {
                  field {
                    ... on ProjectV2Field {
                      name
                    }
                  }
                  repository {
                    nameWithOwner
                  }
                }
                ... on ProjectV2ItemFieldTextValue {
                  text
                  field {
                    ... on ProjectV2Field {
                      name
                    }
                  }
                }
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  updatedAt
                  creator {
                    login
                  }
                  field {
                    ... on ProjectV2SingleSelectField {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`
  
  let result = JSON.parse(await requestQuery(query, apiUrl, token))

  for(const project of result.data.repository.projectsV2.nodes){
    if(project.items.pageInfo.hasNextPage){
      const ghostNodes = await resolveRecursiveQuery(project, apiUrl, token)
      project.items.nodes.push(...ghostNodes)
    }
  }

  console.log(result.data.repository.projectsV2.nodes[0].items.nodes.length)
  console.log(result.data.repository.projectsV2.nodes[1].items.nodes.length)
  console.log(result.data.repository.projectsV2.nodes[2].items.nodes.length)

  return result;
}

async function resolveRecursiveQuery(result, apiUrl, token){
  let ghostNodes = []
  
  while(result.items.pageInfo.hasNextPage){
    const query = `query Get {
      node(id: "${result.id}") {
        ... on ProjectV2 {
          items(first: 100, after: "${result.items.pageInfo.endCursor}") {
            pageInfo {
              hasNextPage
              endCursor
            }
            totalCount
            nodes {
              content {
                ... on Issue {
                  title
                  bodyText
                  updatedAt
                  assignees(first:10){
                    nodes{
                      login
                    }
                  }
                  createdAt
                  number
                  linkedBranches(first:10){
                    totalCount
                    nodes{
                      ref{
                        name
                      }
                    }
                  }
                  author {
                    login
                  }
                }
              }
              fieldValues(first: 100) {
                nodes {
                  ... on ProjectV2ItemFieldRepositoryValue {
                    field {
                      ... on ProjectV2Field {
                        name
                      }
                    }
                    repository {
                      nameWithOwner
                    }
                  }
                  ... on ProjectV2ItemFieldTextValue {
                    text
                    field {
                      ... on ProjectV2Field {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                    updatedAt
                    creator {
                      login
                    }
                    field {
                      ... on ProjectV2SingleSelectField {
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`

    let newGhostNodes = JSON.parse(await requestQuery(query, apiUrl, token))

    ghostNodes.push(...newGhostNodes.data.node.items.nodes)

    result.items.pageInfo.hasNextPage = newGhostNodes.data.node.items.pageInfo.hasNextPage
    result.items.pageInfo.endCursor = newGhostNodes.data.node.items.pageInfo.endCursor
  }

  return ghostNodes;
}