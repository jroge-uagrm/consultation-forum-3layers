'use strict'

var Validator = require('Validator');
var CommentData = require('../data/CommentData');
var UserData = require('../data/UserData');
let pejs = require('pejs');
var presentations = pejs();
var user = new UserData();
var comment = new CommentData();

class CommentBusiness {

    register = async (req, res) => {
        let request = (await this.getRequest(req)).data;
        if (request == undefined)
            return this.response(res, 400, "Validation failed.", { data: {} });
        var v = Validator.make(request, {
            content: 'required',
            publication_id: 'required|numeric',
            user_id: 'required|numeric'
        });
        if (v.fails())
            return this.sendResponse(res, 400, "Validation failed.", v.getErrors());
        try {
            var newComment = await comment.create(request);
            return this.sendResponse(res, 201, "Comment created.", newComment);
        } catch (e) {
            return this.sendResponse(res, 500, e.message, e);
        }
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
        presentations.render(`./presentation/publication/${file}`, { data, host: process.env.APP_HOST }, (error, str) => {
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

module.exports = CommentBusiness;