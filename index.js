import { GQLPaginator } from './src/githubGQLPaginatorService.js';
import dotenv from 'dotenv';

dotenv.config();

const zenhubToken = process.env.ZH_TOKEN
const githubToken = process.env.GH_TOKEN

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
}`, zenhubToken, 'zenhub-v1.0.0'));