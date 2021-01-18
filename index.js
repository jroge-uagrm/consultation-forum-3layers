'use strict'

require('dotenv').config()

var migrations = require('./db/migrations');
migrations.execute();

const http = require('http');
var nodeStatic = require('node-static');
var authMid = require('./auth/middleware');
var fileServer = new nodeStatic.Server('./public');
const Business = require('./business/Business');
const UserBusiness = require('./business/UserBusiness');
const PublicationBusiness = require('./business/PublicationBusiness');
const CommentBusiness = require('./business/CommentBusiness');
const CategoryBusiness = require('./business/CategoryBusiness');
const GroupBusiness = require('./business/GroupBusiness');
const userBusiness = new UserBusiness();
const business = new Business();
const publicationBusiness = new PublicationBusiness();
const commentBusiness = new CommentBusiness();
const categoryBusiness = new CategoryBusiness();
const groupBusiness = new GroupBusiness();

const host = process.env.APP_HOST || 'http://localhost';
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    handleRequest(req, res);
});

server.listen(port, () => {
    console.log(`Server running at ${host}/`);
});

async function handleRequest(req, res) {
    switch (req.method) {
        case 'GET':
            await handleGet(req, res);
            break;
        case 'POST':
            await handlePost(req, res);
            break;
        default:
            await routeNotFound(req, res);
            break;
    }
}

async function handleGet(req, res) {
    switch (req.url) {
        case '/': business.redirectTo(res, '/login'); break;
        case '/echo': business.sendEcho(res); break;
        case '/me': authMid.authenticate(req, res); break;
        case '/register': userBusiness.registerPresentation(res); break;
        case '/login': userBusiness.loginPresentation(res); break;
        case '/home': publicationBusiness.publicationsPresentation(res); break;
        case '/publication': publicationBusiness.registerPresentation(res); break;
        case '/categories': categoryBusiness.getAll(res); break;
        case '/group': groupBusiness.registerPresentation(res); break;
        default: handleRouteWithParams(req, res); break;
    }
}

async function handlePost(req, res) {
    switch (req.url) {
        case '/register': userBusiness.register(req, res); break;
        case '/login': userBusiness.login(req, res); break;
        case '/comment': commentBusiness.register(req, res); break;
        case '/publication': publicationBusiness.register(req, res); break;
        case '/group': groupBusiness.register(req, res); break;
        default: routeNotFound(req, res); break;
    }
}

async function handleRouteWithParams(req, res) {
    if (req.url.match(/\/publications\/([0-9]+)+/)) {
        const id = req.url.split('/')[2];
        return publicationBusiness.getPublicationsFromUserId(res, id);
    } else if (req.url.match(/\/publication\/([0-9]+)+/)) {
        const id = req.url.split('/')[2];
        return publicationBusiness.getPublication(res, id);
    } else if (req.url.match(/\/group\/([0-9]+)+/)) {
        const id = req.url.split('/')[2];
        return groupBusiness.getGroup(res, id);
    } else if (req.url.match(/\/search\/\w+\/\w+/)) {
        const tableName = req.url.split('/')[2];
        const word = req.url.split('/')[3];
        switch (tableName) {
            case 'categories': return categoryBusiness.search(res, word);
            case 'groups': return groupBusiness.search(res, word);
            case 'users': return userBusiness.search(res, word);
            default: business.sendPresentation(res, 'not-found'); break;
        }
    } else if (req.url.match(/\/search\/\w+\/\w+/)) {
        const tableName = req.url.split('/')[2];
        const word = req.url.split('/')[3];
        switch (tableName) {
            case 'categories':
                return categoryBusiness.search(res, word);
            default:
                business.sendPresentation(res, 'not-found');
                break;
        }
    } else {
        fileServer.serve(req, res, (error, response) => {
            if (error && (error.status === 404)) {
                business.sendPresentation(res, 'not-found');
            }
        });
    }
}
