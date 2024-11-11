const { GQLPaginator } = require('../src/GQLPaginatorService.js');
const assert = require('assert');
const dotenv = require('dotenv');
dotenv.config();

const githubToken = process.env.GH_TOKEN

describe('Github test', () => {
  it('Should return issues paginated. Query is asking for 30 issues and GQLPaginator returns issues total count', async () => {
    var result2 = await GQLPaginator(`
    {
      repository(name: "psg2-2223-g6-63", owner:"gii-is-psg2") {
        issues(first: 30) {
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
                endCursor
              }
              nodes {
                id
                createdAt
                state
                reactions (first: 1) {
                  totalCount
                  pageInfo {
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
    }`, githubToken, 'github-v1.0.0');
    assert.strictEqual(result2.data.repository.issues.nodes.length, result2.data.repository.issues.totalCount);
  }).timeout(60000);
});