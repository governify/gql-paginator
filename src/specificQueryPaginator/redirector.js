const inProgressIssuesPaginator = require('../specificQueryPaginator/githubProjectQueries/inProgressIssuesPaginator.js');

module.exports = {resolveSpecificQueryPaginator };

async function resolveSpecificQueryPaginator(token, apiVersionConfig, config) {
    switch (apiVersionConfig) {
        case 'SQP-githubProjectQueries-inProgressIssuesPaginator':
            return await inProgressIssuesPaginator.resolve(token, config)
    }        
}


