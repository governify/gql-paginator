const { requestQuery } = require('./utils.js');

module.exports = { paginatorCustomQueries };

async function paginatorCustomQueries(queryOptions, token, apiConfig) {
    let initialData = await requestQuery(queryOptions.initialQuery, apiConfig.url, token);
    initialData = JSON.parse(initialData);

    try {
        for(const subqueryOptions of queryOptions.subqueries) {
            subqueryOptions.pathItemId = getNthFromEndInPath(subqueryOptions.insertResultAtPath, 4);
            subqueryOptions.pathTarget = getNthFromEndInPath(subqueryOptions.insertResultAtPath, 2);
            await resolveSubquery(initialData, subqueryOptions, apiConfig.url, token, null);
        }
        return initialData;
    } catch (error) {
        return initialData
    }
}

let currentId;

async function resolveSubquery(data, subqueryOptions, url, token, currentPath) {
    let properties = [];
    for (const property in data) {
        console
        properties.push(property);
    }
    if(properties.length == 0){ // Base case
        return;
    }
    if(currentPath === subqueryOptions.pathItemId){
        for(const node of data.nodes){
           currentId = node.id;
           await resolvePagination(node, subqueryOptions, url, token);
        }
        return;
    }
    for(const property of properties){
        if(data.hasOwnProperty(property)){
            var subData = data[property];
            await resolveSubquery(subData, subqueryOptions, url, token, `${property}`);
        }
    }
    return
}

async function resolvePagination(node, subqueryOptions, url, token) {
    let actualPage = node[subqueryOptions.pathTarget].pageInfo;
    let subqueryTemplate = subqueryOptions.query;
    while(actualPage.hasNextPage){
        subqueryOptions.query = subqueryTemplate;
        subqueryOptions.query = subqueryOptions.query.replace('%node.id%', currentId).replace('%pageinfo.endcursor%', actualPage.endCursor);
        let result = await requestQuery(subqueryOptions.query, url, token);
        result = JSON.parse(result);
        node[subqueryOptions.pathTarget].nodes.push(...result.data.node[subqueryOptions.pathTarget].nodes);
        actualPage = result.data.node[subqueryOptions.pathTarget].pageInfo;
    }
    return
}

function getNthFromEndInPath(pathStr, n) {
    const path = pathStr.split('.');
    return path[path.length - n];
}