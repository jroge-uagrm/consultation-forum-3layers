'use strict'

var Validator = require('Validator');
var CategoryData = require('../data/CategoryData');
var UserData = require('../data/UserData');
let pejs = require('pejs');
var presentations = pejs();
var user = new UserData();
var category = new CategoryData();

class CategoryBusiness {

    search = async (res, word) => {
        var categories = await category.search(word);
        return this.sendResponse(res, 200, "Categories found.", { categories: categories });
    }

    sendResponse = (res, code, message, body = {}) => {
        console.log("Sending response:" + message);
        res.statusCode = code;
        res.setHeader('Content-type', 'application/json');
        let response = JSON.stringify({
            message: message,
            body: body
        });
        res.end(response);
    }

    sendPresentation = (res, file, data = {}) => {
        console.log("Sendingd presentation:" + file);
        presentations.render(`./presentations/publication/${file}`, { data, host: process.env.APP_HOST }, (error, str) => {
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

module.exports = CategoryBusiness;