import { GQLPaginator } from '../src/githubGQLPaginatorService.js';
import assert from 'assert';
import dotenv from 'dotenv';
dotenv.config();

const zenhubToken = process.env.ZH_TOKEN
const githubToken = process.env.GH_TOKEN

describe('Zenhub test', () => {
  it('Should return issues paginated. Query is asking for 30 issues and GQLPaginator returns issues total count', async () => {
    var result1 = await GQLPaginator(`query {
      workspace(id: "6408a9afdf53d5002e65f699") {
        repositoriesConnection(first: 10) {
          nodes {
            id
            ghId
            name
            issues(first:30){
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
    }`, zenhubToken, 'zenhub-v1.0.0');
    assert.strictEqual(result1.workspace.repositoriesConnection.nodes[0].issues.nodes.length, result1.workspace.repositoriesConnection.nodes[0].issues.totalCount);
  }).timeout(60000);
});


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
    assert.strictEqual(result2.repository.issues.nodes.length, result2.repository.issues.totalCount);
  }).timeout(60000);
});