'user strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var UserData = require('../data/UserData');
var Business = require('../business/Business');
var business = new Business();
var user = new UserData();
var key = process.env.APP_SECRET_JWT_KEY;

exports.authenticate = async function (req, res, next = () => { }) {
    //console.log("Headers.");
    //console.log(req.headers);
    if (!req.headers.authorization) {
        return business.sendResponse(res, 401, "Unauthorized.");
    }
    var token = req.headers.authorization.replace(/['"]+/g, '');
    try {
        var payload = jwt.decode(token, key);
        //console.log(payload);
        if (payload.exp <= moment().unix()) {
            return business.sendResponse(res, 401, "Your session has expired.");
        }
        let userVerifying = await user.getUserByEmail(payload.email);
        if (userVerifying.access_token == token)
            return business.sendResponse(res, 200, "User ok.");
        return business.sendResponse(res, 401, "Session expired.");
    } catch (ex) {
        return business.sendResponse(res, 401, "Invalid token.");
    }
}
