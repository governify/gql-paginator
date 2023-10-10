import axios from 'axios';
import fs from 'fs';
import { graphQlQueryToJson } from 'graphql-query-to-json'; // npm install graphql-query-to-json
import { jsonToGraphQLQuery } from 'json-to-graphql-query'; // npm install json-to-graphql-query

  // Assumptions: ARRAYS ONLY EXIST IN NODES, An array is not contemplated elsewhere
  // WHEN AN OBJECT HAS NODES AS A PROPERTY, IT IS CONSIDERED A PAGEABLE TYPE
  // PAGEABLE TYPES ARE NOT CONTEMPLATED IN A SIMPLE TYPE

  // Public function --------------------------------------------------------------------------------------------------
  export async function githubGQLPaginator(query, token){
    tokenPred = token;
    originalQuery = query;

    const result = await requestQuery(query);

    return await pagination(JSON.parse(result));
  }


  // Auxiliar function --------------------------------------------------------------------------------------------------
  async function pagination(result) {

    await resolvePtypePagesRecursive(result, "repository");

    const finalResultJSON = JSON.stringify(result, null, 2);

    const nombreArchivo = 'finalResult.json';
    
    fs.writeFile(nombreArchivo, finalResultJSON, (err) => {
      if (err) {
        console.error('Error al escribir el archivo JSON:', err);
      } else {
        console.log(`El archivo ${nombreArchivo} ha sido creado exitosamente.`);
      }
    });

    return result;
  }


  // Global variables -----------------------------------------------------------------------------------------------------
  var originalQuery = "";

  var tokenPred = "";

  var ptypePath = [];

  var lastVisitedIdByPtype = {};


  // Recursive function --------------------------------------------------------------------------------------------------
  async function resolvePtypePagesRecursive(currentResult, rootAttribute) {
      
    const properties = []
    for (const property in currentResult) { // Collect all keys from the result
      if(property!=="pageInfo" && property!=="totalCount" && typeof currentResult[property]!=="string" || property=="id")
        properties.push(property);
    }

    if(properties.includes("id")){ // Stores the last ids of each pageable type that has been visited
      lastVisitedIdByPtype[ptypePath[ptypePath.length-1]] = currentResult.id;
    }
    
    if(properties.length == 0){ // Base case
      return;
    }

    if(properties.includes("nodes")){ // Check if pagination can be performed
      if(!ptypePath.includes(rootAttribute)) ptypePath.push(rootAttribute) // Stores the path to follow when finding a pageable type
      const nodesHasMorePages = currentResult?.pageInfo?.hasNextPage;
      const totalCountExist = currentResult.hasOwnProperty("totalCount");
      const endCursorExist = currentResult.pageInfo?.hasOwnProperty("endCursor");
      const nodesHasIdProperty = currentResult.nodes?.[0]?.hasOwnProperty("id");
      if( nodesHasMorePages && totalCountExist && endCursorExist && nodesHasIdProperty){
        const cursor = currentResult.pageInfo.endCursor;
        const ghostNodes = await getAllGhostNodes(cursor); // Solve pagination
        currentResult.nodes.push(...ghostNodes);
      }
    }
    
    if(properties.includes("nodes")){ // Loop through all nodes when we find a pageable type
      for(const node of currentResult.nodes){
        var subResult = node;
        await resolvePtypePagesRecursive(subResult, "nodes");
      }
      ptypePath.pop(); // Delete the last element of the path because we have already gone through all the nodes and we are already going back
      return;
    }

    // Browse all found properties
    for(const property of properties){
      if(currentResult.hasOwnProperty(property)){
        var subResult = currentResult[property];
        await resolvePtypePagesRecursive(subResult, property);
      }
    }
    return;
  }
  

  // Ghost Nodes --------------------------------------------------------------------------------------------------
  async function getAllGhostNodes(cursorOfNextPage){
    var hasNextPage = true;
    var finalGhostNodes = [];

    var originalQueryObj = graphQlQueryToJson(originalQuery) // Used inside an eval()

    const firstLevelPtype = ptypePath.length == 1;

    if(firstLevelPtype){
      var getNextPageQuery = originalQuery.replace(new RegExp(`${ptypePath[0]}\\(`, 'g'), `${ptypePath[0]}(after: "#NEWCURSOR#", `);
      while(hasNextPage){

        var nextPageResult = await requestQuery(getNextPageQuery.replace(/#NEWCURSOR#/g, cursorOfNextPage))

        var nextPageResultJSON = JSON.parse(nextPageResult);

        var newGhostNodes = nextPageResultJSON.repository[ptypePath[ptypePath.length-1]].nodes;

        if(nextPageResultJSON.repository[ptypePath[0]].pageInfo.hasNextPage){
          cursorOfNextPage = nextPageResultJSON.repository[ptypePath[0]].pageInfo.endCursor;
        } else{
            hasNextPage = false;
        }

        finalGhostNodes.push(...newGhostNodes);
        
      }
    } else if(!firstLevelPtype){
      while(hasNextPage){

        var ptypeRuteString = "";

        for(var i = 0; i<ptypePath.length-1;i++){
          const lastElement = ptypePath[i];
          const capitalizeFirstCharAndDeleteLastChar = lastElement.charAt(0).toUpperCase() + lastElement.slice(1, -1);
          ptypeRuteString += capitalizeFirstCharAndDeleteLastChar;
        }

        var nodeId = lastVisitedIdByPtype[ptypePath[ptypePath.length-2]] // Second to last pageable type of the path

        var pathIncludingNodes = ptypePath.map(element => `${element}.nodes`).join(".")
        var nodesProperties = jsonToGraphQLQuery(eval("originalQueryObj.query.repository."+pathIncludingNodes), { pretty: true });

        var getNextPageQuery =     
        `query Get${ptypeRuteString}ById {
          node(id: \"${nodeId}\") { 
            ... on ${ptypeRuteString} {
              id
              ${ptypePath[ptypePath.length-1]}(first: 1, after: \"${cursorOfNextPage}\"){
                pageInfo {
                  hasNextPage
                  endCursor
                }
                totalCount
                nodes{
                  ${nodesProperties}
                }
              }
            }
          }
        }`

        var nextPageResult = await requestQuery(getNextPageQuery);

        var nextPageResultJSON = JSON.parse(nextPageResult);

        var newGhostNodes = nextPageResultJSON.node[ptypePath[ptypePath.length-1]].nodes;

        if(nextPageResultJSON.node[ptypePath[ptypePath.length-1]].pageInfo.hasNextPage){
          cursorOfNextPage = nextPageResultJSON.node[ptypePath[ptypePath.length-1]].pageInfo.endCursor;
        } else{
          hasNextPage = false;
        }

        finalGhostNodes.push(...newGhostNodes);

      }
    }
    return finalGhostNodes;
  }


  //  Request GQL query --------------------------------------------------------------------------------------------------
  async function requestQuery(query) {
    const apiUrl = 'https://api.github.com/graphql';
    const requestConfig = {
      headers: {
        Authorization: `Bearer ${tokenPred}`,
        Accept: 'application/vnd.github.starfox-preview+json',
      },
    };
    try {
      const result = await axios.post(apiUrl, { query }, requestConfig);

      if (result.status === 200) {
        const responseData = result.data.data;

        if (!responseData) {
          throw new Error('El repositorio no fue encontrado');
        }

        const repositoryJSON = JSON.stringify(responseData);

        return repositoryJSON;
      } else {
        throw new Error(`Error en la solicitud: ${result.statusText}`);
      }
    } catch (error) {
      throw new Error(`Error en la solicitud: ${error.message}`);
    }
  }