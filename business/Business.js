'use strict'

let pejs = require('pejs');
var presentations = pejs();

class Business {

    sendEcho = (res) => {
        this.sendResponse(res, 200, 'All ok.');
    }

    redirectTo = (res, route) => {
        res.writeHead(301, { 'Location': route });
        res.end();
    }

    routeNotFound = (res) => {
        this.sendPresentation(res, 'not-found');
    }

    sendResponse = (res, code, message, body = {}) => {
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

    sendPresentation = (res, file, data = {}) => {
        console.log("Sending presentation:" + file);
        presentations.render(`./presentation/${file}`, { data, host: process.env.APP_HOST }, (error, str) => {
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

module.exports = Business;