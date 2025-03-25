const { GQLPaginator } = require('./src/GQLPaginatorService.js');
const dotenv = require('dotenv');

dotenv.config();

module.exports = { GQLPaginator };

const zenhubToken = process.env.ZH_TOKEN
const githubToken = process.env.GH_TOKEN
const execTest = false;

async function fetchData() {
  try {
    let query= {
      initialQuery:"{\r\n  repository(name: \"psg2-2425-g8-83\", owner: \"gii-is-psg2\") {\r\n    projectsV2(first: 5) {  \r\n      totalCount\r\n      nodes {\r\n        id\r\n        items(first: 1) {\r\n          totalCount\r\n          pageInfo{\r\n            hasNextPage\r\n            endCursor\r\n          }\r\n          nodes {\r\n            content {\r\n              ... on Issue {\r\n                title\r\n                bodyText\r\n                updatedAt\r\n                assignees(first:10){\r\n                  nodes{\r\n                    login\r\n                  }\r\n                }\r\n                createdAt\r\n                number\r\n                linkedBranches(first:10){\r\n                  totalCount\r\n                  nodes{\r\n                    ref{\r\n                      name\r\n                    }\r\n                  }\r\n                }\r\n                author {\r\n                  login\r\n                }\r\n              }\r\n            }\r\n            fieldValues(first: 100) {\r\n              nodes {\r\n                ... on ProjectV2ItemFieldRepositoryValue {\r\n                  field {\r\n                    ... on ProjectV2Field {\r\n                      name\r\n                    }\r\n                  }\r\n                  repository {\r\n                    nameWithOwner\r\n                  }\r\n                }\r\n                ... on ProjectV2ItemFieldTextValue {\r\n                  text\r\n                  field {\r\n                    ... on ProjectV2Field {\r\n                      name\r\n                    }\r\n                  }\r\n                }\r\n                ... on ProjectV2ItemFieldSingleSelectValue {\r\n                  name\r\n                  updatedAt\r\n                  creator {\r\n                    login\r\n                  }\r\n                  field {\r\n                    ... on ProjectV2SingleSelectField {\r\n                      name\r\n                    }\r\n                  }\r\n                }\r\n              }\r\n            }\r\n          }\r\n        }\r\n      }\r\n    }\r\n  }\r\n}" ,
      subqueries:[
            {
                "query": "query Get {\r\n      node(id: \"%node.id%\") {\r\n        ... on ProjectV2 {\r\n          items(first: 20, after: \"%pageinfo.endcursor%\") {\r\n            pageInfo {\r\n              hasNextPage\r\n              endCursor\r\n            }\r\n            totalCount\r\n            nodes {\r\n              content {\r\n                ... on Issue {\r\n                  title\r\n                  bodyText\r\n                  updatedAt\r\n                  assignees(first:10){\r\n                    nodes{\r\n                      login\r\n                    }\r\n                  }\r\n                  createdAt\r\n                  number\r\n                  linkedBranches(first:10){\r\n                    totalCount\r\n                    nodes{\r\n                      ref{\r\n                        name\r\n                      }\r\n                    }\r\n                  }\r\n                  author {\r\n                    login\r\n                  }\r\n                }\r\n              }\r\n              fieldValues(first: 100) {\r\n                nodes {\r\n                  ... on ProjectV2ItemFieldRepositoryValue {\r\n                    field {\r\n                      ... on ProjectV2Field {\r\n                        name\r\n                      }\r\n                    }\r\n                    repository {\r\n                      nameWithOwner\r\n                    }\r\n                  }\r\n                  ... on ProjectV2ItemFieldTextValue {\r\n                    text\r\n                    field {\r\n                      ... on ProjectV2Field {\r\n                        name\r\n                      }\r\n                    }\r\n                  }\r\n                  ... on ProjectV2ItemFieldSingleSelectValue {\r\n                    name\r\n                    updatedAt\r\n                    creator {\r\n                      login\r\n                    }\r\n                    field {\r\n                      ... on ProjectV2SingleSelectField {\r\n                        name\r\n                      }\r\n                    }\r\n                  }\r\n                }\r\n              }\r\n            }\r\n          }\r\n        }\r\n      }\r\n    }",
                "insertResultAtPath": "repository.projectsV2.nodes.items.nodes"
            }
        ]
    }

    let query2 = `{
      repository(name: "psg2-2223-g6-63", owner:"gii-is-psg2") {
        issues(first: 25) {
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
        pullRequests(first: 10, states: MERGED) {
          totalCount
          pageInfo {
            hasNextPage
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
    }
  `;

    const result = await GQLPaginator(query, githubToken, 'github-v1.0.0');

    console.log(result);
  } catch (error) {
    console.error('Error:', error);
  }
}

if(execTest)
  fetchData();