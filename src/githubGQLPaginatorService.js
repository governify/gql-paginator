import axios from 'axios';
import fs from 'fs';
import { graphQlQueryToJson } from 'graphql-query-to-json'; //npm install graphql-query-to-json
import { jsonToGraphQLQuery } from 'json-to-graphql-query'; //npm install json-to-graphql-query


  // Supuestos: SOLO EXISTEN ARRAYS EN NODES, No se contempla un array en otro sitio
  // CUANDO UN OBJETO TIENE COMO PROPIEDAD NODES SE CONSIDERA UN META OBJETOç
  //NO SE CONTEMPLA METATIPO DE UN TIPO SIMPLE

  /*
  {
        repository(name: "${name}", owner:"${owner}") {
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
  */


  // Public function ------------------------------------------------------------------------------------
  export async function githubGQLPaginator(query, token){
    tokenPred = token;
    originalQuery = query;

    const result = await requestQuery(query);
    console.log("PREVIEW STRINGYFY RESULT: ", result)
    console.log("PREVIEW PARSE RESULT: ", JSON.parse(result))
    return await pagination(JSON.parse(result));
  }


  //Auxiliar function ---------------------------------------------------------------------------------
  async function pagination(result) {

    await resolveMtypePagesRecursive(result, "repository");

    console.log(result);
    console.log(result.repository.issues.nodes.length);

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


  // Global variables ------------------------------------------------------------------------------------
  var originalQuery = "";

  var tokenPred = "";

  var mtypePath = [];

  var lastVisitedIdByMtype = {};


  // Recursive function --------------------------------------------------------------------------------------------------
  async function resolveMtypePagesRecursive(currentResult, rootAttribute) {
    
    console.log("ATRIBUTO RAIZ: ", rootAttribute)
    
    const properties = []
    for (const property in currentResult) { //Recopila todas las claves del resultado
      if(property!=="pageInfo" && property!=="totalCount" && typeof currentResult[property]!=="string" || property=="id")
        properties.push(property);
    }

    if(properties.includes("id")){ //Almacena las última ids de cada metatipo que se ha visitado
      lastVisitedIdByMtype[mtypePath[mtypePath.length-1]] = currentResult.id;
    }
    
    if(properties.length == 0){ //Caso base
      console.log("CASO BASE")
      return;
    }

    console.log(`RESULT CONTIENE LAS SIGUIENTE PROPIEDADES ${properties}`);

    if(properties.includes("nodes")){ //Comprueba si se puede realizar paginación
      if(!mtypePath.includes(rootAttribute)) mtypePath.push(rootAttribute) //Almacena la ruta a seguir al encontrar un metatipo
      const nodesHasMorePages = currentResult?.pageInfo?.hasNextPage;
      const totalCountExist = currentResult.hasOwnProperty("totalCount");
      const endCursorExist = currentResult.pageInfo?.hasOwnProperty("endCursor");
      const nodesHasIdProperty = currentResult.nodes?.[0]?.hasOwnProperty("id");
      if( nodesHasMorePages && totalCountExist && endCursorExist && nodesHasIdProperty){
        console.log("ESTE ATRIBUTO ES PAGINALBLE: ", rootAttribute)
        const cursor = currentResult.pageInfo.endCursor;
        console.log("RESULTADO ANTIGUO: ", currentResult)
        console.log(currentResult.nodes.length)
        const ghostNodes = await getAllGhostNodes(cursor); //Resuelve la paginación

        currentResult.nodes.push(...ghostNodes);
        
        console.log("NUEVO RESULTADO: ", currentResult)
        console.log(currentResult.nodes.length)

      }
    }
    
    if(properties.includes("nodes")){ //recorre todos los nodos cuando encontramos un metatipo
      console.log("NODES ENCONTRADO: ", currentResult.nodes.length)
      for(const node of currentResult.nodes){
        var subResult = node;
        console.log(subResult)
        await resolveMtypePagesRecursive(subResult, "nodes");
      }
      mtypePath.pop(); //Elimina el ultimo elemento de la ruta porque ya hemos recorrido todos los nodos y ya volvemos hacia atras
      return;
    }

    //Recorre todas la propiedades encontradas
    for(const property of properties){
      if(currentResult.hasOwnProperty(property)){
        var subResult = currentResult[property];
        console.log("COMPROBANDO ", property)
        await resolveMtypePagesRecursive(subResult, property);
      }
    }
    return;
  }
  

  // Ghost Nodes -----------------------------------------------------------------------------------------
  async function getAllGhostNodes(cursorOfNextPage){
    console.log("RUTA: ", mtypePath)
    var hasNextPage = true;
    var finalGhostNodes = [];

    console.log(originalQuery)

    var originalQueryObj = graphQlQueryToJson(originalQuery) // Used inside an eval()

    const firstLevelMtype = mtypePath.length == 1;

    if(firstLevelMtype){
      var getNextPageQuery = originalQuery.replace(new RegExp(`${mtypePath[0]}\\(`, 'g'), `${mtypePath[0]}(after: "#NEWCURSOR#", `);
      while(hasNextPage){
        console.log(getNextPageQuery.replace(/#NEWCURSOR#/g, cursorOfNextPage));

        var nextPageResult = await requestQuery(getNextPageQuery.replace(/#NEWCURSOR#/g, cursorOfNextPage))

        console.log(nextPageResult)

        var nextPageResultJSON = JSON.parse(nextPageResult);

        var newGhostNodes = nextPageResultJSON.repository[mtypePath[mtypePath.length-1]].nodes;

        if(nextPageResultJSON.repository[mtypePath[0]].pageInfo.hasNextPage){
          cursorOfNextPage = nextPageResultJSON.repository[mtypePath[0]].pageInfo.endCursor;
        } else{
            hasNextPage = false;
        }

        finalGhostNodes.push(...newGhostNodes);
      }
    } else if(!firstLevelMtype){
      while(hasNextPage){
        var metatypeRuteString = "";
        for(var i = 0; i<mtypePath.length-1;i++){
          const lastElement = mtypePath[i];
          const capitalizeFirstCharAndDeleteLastChar = lastElement.charAt(0).toUpperCase() + lastElement.slice(1, -1);
          metatypeRuteString += capitalizeFirstCharAndDeleteLastChar;
        }

        var nodeId = lastVisitedIdByMtype[mtypePath[mtypePath.length-2]] //Antepenultimo metatipo de la ruta

        //nodesQuery = getNodeSectionFromQuery();
        var pathIncludingNodes = mtypePath.map(element => `${element}.nodes`).join(".")
        var nodesProperties = jsonToGraphQLQuery(eval("originalQueryObj.query.repository."+pathIncludingNodes), { pretty: true });

        console.log("PROPERTIES NODES: ", nodesProperties);

        var getNextPageQuery =     
        `query Get${metatypeRuteString}ById {
          node(id: \"${nodeId}\") { 
            ... on ${metatypeRuteString} {
              id
              ${mtypePath[mtypePath.length-1]}(first: 1, after: \"${cursorOfNextPage}\"){
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

        console.log(getNextPageQuery);

        var nextPageResult = await requestQuery(getNextPageQuery);

        var nextPageResultJSON = JSON.parse(nextPageResult);

        var newGhostNodes = nextPageResultJSON.node[mtypePath[mtypePath.length-1]].nodes;

        if(nextPageResultJSON.node[mtypePath[mtypePath.length-1]].pageInfo.hasNextPage){
          cursorOfNextPage = nextPageResultJSON.node[mtypePath[mtypePath.length-1]].pageInfo.endCursor;
        } else{
          hasNextPage = false;
        }

        finalGhostNodes.push(...newGhostNodes);

      }
    }
    return finalGhostNodes;
  }


  //  Request GQL query ----------------------------------------------------------------------
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

      // Verificar si la respuesta es exitosa (código de estado 200)
      if (result.status === 200) {
        const responseData = result.data.data;

        if (!responseData) {
          throw new Error('El repositorio no fue encontrado');
        }

        // Convertir los datos a JSON utilizando JSON.stringify
        const repositoryJSON = JSON.stringify(responseData);

        return repositoryJSON; // Devuelve los datos como JSON
      } else {
        throw new Error(`Error en la solicitud: ${result.statusText}`);
      }
    } catch (error) {
      throw new Error(`Error en la solicitud: ${error.message}`);
    }
  }