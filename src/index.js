import { githubGQLPaginator } from './githubGQLPaginatorService.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TOKEN

console.log(await githubGQLPaginator(`{
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
  }`, token));