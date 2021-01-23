'use strict'

var Validator = require('Validator');
var PublicationData = require('../data/PublicationData');
var UserData = require('../data/UserData');
var CommentData = require('../data/CommentData');
var PublicationCategoryData = require('../data/GroupCategory-data');
let pejs = require('pejs');
var presentations = pejs();
var user = new UserData();
var publication = new PublicationData();
var comment = new CommentData();
var publicationCategory = new PublicationCategoryData();

class PublicationBusiness {

    registerPresentation = (res) => {
        this.sendPresentation(res, 'register');
    }

    register = async (req, res) => {
        let request = (await this.getRequest(req)).data;
        if (request == undefined)
            return this.response(res, 400, "Validation failed.", { data: {} });
        var v = Validator.make(request, {
            title: 'required',
            content: 'required',
            user_id: 'required|numeric',
            category_id: 'required|numeric'
        });
        if (v.fails())
            return this.sendResponse(res, 400, "Validation failed.", v.getErrors());
        try {
            var newPublication = await publication.create(request);
            return this.sendResponse(res, 201, "Publication created.", newPublication);
        } catch (e) {
            return this.sendResponse(res, 500, e.message, e);
        }
    }

    publicationsPresentation = (res) => {
        this.sendPresentation(res, 'mine');
    }

    getPublicationsFromUserId = async (res, userId) => {
        let userOwner = await user.getUserById(userId);
        if (!userOwner)
            return this.sendPresentation(res, 'not-found');
        try {
            let publications = await publication.getFromUserId(userId);
            this.sendPresentation(res, 'publications', {
                publications: publications,
                user: userOwner
            });
        } catch (e) {
            this.sendResponse(res, 500, e.message, e);
        }
    }

    getPublication = async (res, id) => {
        let publicationFound = await publication.getFromId(id);
        if (!publicationFound)
            return this.sendPresentation(res, 'not-found');
        let userOwner = await user.getUserById(publicationFound.user_id);
        let publicationComments = await comment.getFromPublicationId(id);
        this.sendPresentation(res, 'publication', {
            publication: publicationFound,
            user: userOwner,
            comments: publicationComments
        });
    }

    sendResponse = (res, code, message, body = {}) => {
        console.log("Sending response:" + message);
        res.statusCode = code;
        res.setHeader('Content-type', 'application/json');
        let response = JSON.stringify({
            message: message,
            body: body
        });
        //console.log("response:");
        //console.log(JSON.parse(response));
        res.end(response);
    }

    sendPresentation = (res, file, data) => {
        console.log("Sending presentation:" + file);
        var myData = { data, host: process.env.APP_HOST };
        //console.log(myData);
        if (file != 'not-found')
            presentations.render(`./presentation/publication/${file}`, myData, (error, str) => {
                res.statusCode = 200;
                res.setHeader('Content-type', 'text/html');
                res.end(str);
            });
        else
            presentations.render(`./presentation/${file}`, myData, (error, str) => {
                res.statusCode = 200;
                res.setHeader('Content-type', 'text/html');
                res.end(str);
            });
    }

    getRequest = (req) => {
        return new Promise((resolve, reject) => {
            try {
                let body = '';
                req.on('data', (chunk) => {
                    body += chunk.toString();
                });
                req.on('end', () => {
                    let o = JSON.parse(body);
                    resolve(o);
                })
            } catch (e) {
                reject(e);
            }
        });
    }
}

module.exports = PublicationBusiness;