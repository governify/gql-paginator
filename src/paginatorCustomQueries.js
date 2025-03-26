const { requestQuery } = require('./utils.js');

module.exports = { paginatorCustomQueries };

async function paginatorCustomQueries(queryOptions, token, apiConfig) {
    let initialData = await requestQuery(queryOptions.initialQuery, apiConfig.url, token);
    initialData = JSON.parse(initialData);

    try {
        for(const subqueryOptions of queryOptions.subqueries) {
            if(getDepthFromPath(subqueryOptions.insertResultAtPath) < 4){
                subqueryOptions.pathItemId = getNthFromEndInPath(subqueryOptions.insertResultAtPath, 2);
                subqueryOptions.pathTarget = getNthFromEndInPath(subqueryOptions.insertResultAtPath, 2);
                subqueryOptions.initialPath = getNthFromEndInPath(subqueryOptions.insertResultAtPath, 3);
                await resolveSubquery(initialData, subqueryOptions, apiConfig.url, token, null, 0);
            } else {
                subqueryOptions.pathItemId = getNthFromEndInPath(subqueryOptions.insertResultAtPath, 4);
                subqueryOptions.pathTarget = getNthFromEndInPath(subqueryOptions.insertResultAtPath, 2);
                await resolveSubquery(initialData, subqueryOptions, apiConfig.url, token, null, 0);
            }
        }
        return initialData;
    } catch (error) {
        console.log(error);
        return initialData
    }
}

let currentId;

async function resolveSubquery(data, subqueryOptions, url, token, currentPath, depth) {
    const maxDepth = 15;
    if (depth > maxDepth) {
        return
    }

    let properties = [];
    for (const property in data) {
        properties.push(property);
    }
    if(properties.length == 0){ // Base case
        return;
    }
    if(currentPath === subqueryOptions.pathItemId){
        if(subqueryOptions.pathItemId === subqueryOptions.pathTarget){
            await resolveBaseCasePagination(data, subqueryOptions, url, token);
            return;
        } else {
            for(const node of data.nodes){
                currentId = node.id;
                await resolvePagination(node, subqueryOptions, url, token);
            }
            return;
        }
    }
    for(const property of properties){
        if(data.hasOwnProperty(property)){
            var subData = data[property];
            await resolveSubquery(subData, subqueryOptions, url, token, `${property}`, depth + 1);
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

async function resolveBaseCasePagination(data, subqueryOptions, url, token) {
    let actualPage = data.pageInfo;
    let subqueryTemplate = subqueryOptions.query;
    while(actualPage.hasNextPage){
        subqueryOptions.query = subqueryTemplate;
        subqueryOptions.query = subqueryOptions.query.replace('%node.id%', currentId).replace('%pageinfo.endcursor%', actualPage.endCursor);
        let result = await requestQuery(subqueryOptions.query, url, token);
        result = JSON.parse(result);
        data.nodes.push(...result.data[subqueryOptions.initialPath][subqueryOptions.pathTarget].nodes);
        actualPage = result.data[subqueryOptions.initialPath][subqueryOptions.pathTarget].pageInfo
    }
    return
}

function getNthFromEndInPath(pathStr, n) {
    const path = pathStr.split('.');
    return path[path.length - n];
}

function getDepthFromPath(pathStr) {
    const path = pathStr.split('.');
    return path.length;
}