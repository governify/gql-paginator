# github-gql-paginator
This repository offers utilities and tools to streamline efficient pagination of GraphQL queries in applications using the GitHub API. It simplifies the management of paginated results and provides a ready-to-use solution for your GraphQL-based projects interacting with API data.

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
```
await GQLPaginator(query, token, configuration);
```
Parameters:
-  **Query**: Add the query you need to paginate, and put it in quotes. Remember that to paginate you need to build a query that provides the information necessary to do so. ([How to build a valid query for pagination?](https://www.ejemplo.com))
-  **Token**: Your API token in quotes. You can find more information on how to generate a token on the page of the API you are using.
-  **Configuration**: The required pagination configuration of the API in use. You can use the [visualizeAllAvailableConfigurationsSource]() function to view all available settings. You can also create your own configuration or modify existing ones by following the [configuration creation and editing guide](). Default configurations:
    - github-v1.0.0
    - zenhub-v1.0.0

## Utils
### visualizeAllAvailableConfigurationsSource


