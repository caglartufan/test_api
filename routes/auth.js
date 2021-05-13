const Joi = require('joi');
const bcrypt = require('bcrypt');
const { User, validate } = require('./../models/user');
const mongoose = require('mongoose');
const createError = require('./../helpers/createError');
const express = require('express');
const router = express.Router();

/**
 * @api {post} /auth 1. Authenticate user
 * @apiVersion 0.1.0
 * @apiName Auth
 * @apiGroup Auth
 *
 * @apiParam {String} username New username of the user that is authorized.
 * @apiParam {String} password New password of the user that is authorized.
 * 
 * @apiSuccess {String} jwt Generated JSON Web Token for use in future API calls
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDljNDI0YTJjZWU2OTI5ZDRhY2ZkYzIiLCJpc0FkbWluIjp0cnVlLCJ1c2VybmFtZSI6Im4zcGl4IiwiaWF0IjoxNjIwODk3MzI3fQ.3eoy2rCjwrg4CiWZMW5qRU37ztQbEk4gJ0bsP8XEprw"
 *     }
 * 
 * @apiError ValidationError Given body fields (<code>username, password</code>) are not valid.
 * @apiError InvalidUsernameOrPassword Username or password is not correct.
 *
 * @apiErrorExample ValidationError:
 *     HTTP/1.1 400 ValidationError
 *     {
 *       "error": {
 *         "message": "\"username\" length must be at least 3 characters long",
 *         "statusCode": 400
 *       }
 *     }
 * @apiErrorExample InvalidUsernameOrPassword:
 *     HTTP/1.1 404 InvalidUsernameOrPassword
 *     {
 *       "error": {
 *         "message": "Invalid username or password",
 *         "statusCode": 404
 *       }
 *     }
 */
router.post('/', async (req, res, next) => {
    const { error } = validate(req.body);
    if(error) return res.status(400).send(createError(error.details[0].message, 400));

    let user = await User.findOne({ username: req.body.username });
    if(!user) return res.status(400).send(createError('Invalid username or password', 400));

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if(!validPassword) return res.status(400).send(createError('Invalid username or password', 400));

    const token = user.generateAuthToken();
    res.send({ jwt: token });
});

module.exports = router;