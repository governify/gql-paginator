import { GQLPaginator } from './githubGQLPaginatorService.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TOKEN

console.log(await GQLPaginator(`query {
  workspace(id: "6408a9afdf53d5002e65f699") {
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
}`, token));