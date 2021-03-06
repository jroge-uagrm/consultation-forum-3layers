'use strict'

var Validator = require('Validator');
var UserData = require('../data/UserData');
var jwt = require('../auth/jwt');
let pejs = require('pejs');
var presentations = pejs();
var user = new UserData();

class UserBusiness {

    registerPresentation = (res) => {
        this.sendPresentation(res, 'register');
    }

    register = async (req, res) => {
        let request = (await this.getRequest(req)).data;
        //console.log("request:");
        //console.log(request);
        if (request == undefined)
            return this.response(res, 400, "Validation failed.", { data: {} });
        var name = request.name;
        var lastname = request.lastname;
        request.name = request.name.split(' ').join('');
        request.lastname = request.lastname.split(' ').join('');
        var v = Validator.make(request, {
            name: 'required|alpha',
            lastname: 'required|alpha',
            email: 'required|email',
            password: 'required|confirmed',
            // role: 'required|alpha',
        });
        if (v.fails())
            return this.sendResponse(res, 400, "Validation failed.", v.getErrors());
        request.name = name;
        request.lastname = lastname;
        try {
            var newUser = await user.create(request);
            return this.sendResponse(res, 201, "User created.", newUser);
        } catch (e) {
            if (e.code == 'ER_DUP_ENTRY')
                return this.sendResponse(res, 400, "Email is already taken.", {
                    email: ["Email already used."]
                });
            return this.sendResponse(res, 500, e.message, e);
        }
    }

    loginPresentation = (res) => {
        this.sendPresentation(res, 'login');
    }

    login = async (req, res) => {
        let request = (await this.getRequest(req)).data;
        if (request == undefined)
            return this.sendResponse(res, 400, "Validation failed.", { data: {} });
        var v = Validator.make(request, {
            email: 'required|email',
            password: 'required',
        });
        if (v.fails()) {
            return this.sendResponse(res, 400, "Validation failed.", v.getErrors());
        }
        let userLogin = await user.getUserByEmail(request.email);
        if (!userLogin)
            return this.sendResponse(res, 400, "Email not registered.", { email: ["Email not registered."] });
        let userId = userLogin.id;
        let isCorrectPassword = await user.isCorrectPassword(request.password, userId);
        if (isCorrectPassword) {
            var access_token = jwt.createToken(userLogin);
            userLogin.access_token = access_token;
            userLogin = await user.updateUserById(userId, userLogin);
            return this.sendResponse(res, 200, "Login ok.", { user: userLogin, access_token });
        }
        return this.sendResponse(res, 400, "Incorrect password.", { password: ["Incorrect password."] });
    }

    search = async (res, word) => {
        var users = await user.search(word);
        return this.sendResponse(res, 200, "Users found.", { users: users });
    }

    sendResponse = (res, code, message, body = {}) => {
        console.log("Sending response: " + message);
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
        console.log("Sending presentation: " + file);
        var myData = { data, host: process.env.APP_HOST };
        //console.log(myData);
        presentations.render(`./presentation/user/${file}`, myData, (error, str) => {
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

module.exports = UserBusiness;