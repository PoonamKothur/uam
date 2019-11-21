const responseHandler = require("../common/responsehandler");
const BaseHandler = require("../common/basehandler");
const utils = require('../common/utils');
const Joi = require('joi');
const AWS = require('aws-sdk');
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

class UpdateUser extends BaseHandler {
    //this is main function
    constructor() {
        super();
    }

    getValidationSchema() {
        this.log.info('Inside getValidationSchema');

        return Joi.object().keys({
            cid: Joi.string().required(),
            cuid: Joi.string().required(),
            eid: Joi.string().required(),
            euid: Joi.string().required(),
            role: Joi.string().required(),
            user: {
                firstName: Joi.string(),
                lastName: Joi.string(),
                email: Joi.string().email(),
                phone: Joi.string(),
                creation: Joi.date(),
                lastsignin: Joi.date(),
                lastvisit: Joi.date()
            }
        });
    }

    //values update if user exists
    async updateUser(poolid, uuid, data) {
        var params = {
            UserAttributes: [ /* required */
                {
                    Name: 'given_name', /* required */
                    Value: data.user.firstName
                },
                {
                    Name: 'family_name', /* required */
                    Value: data.user.lastName
                },
                {
                    Name: 'email', /* required */
                    Value: data.user.email
                },
                { 
                    Name: 'phone_number', /* required */  
                    Value: data.user.phone
                },
                { 
                    Name: 'custom:cid', /* required */ 
                    Value: data.cid
                },
                { 
                    Name: 'custom:cuid', /* required */  
                    Value: data.cuid
                },
                { 
                    Name: 'custom:euid', /* required */ 
                    Value: data.euid
                },
                { 
                    Name: 'custom:eid', /* required */  
                    Value: data.eid
                },
            ],
            UserPoolId: poolid, /* required */
            Username: uuid, /* required */
        };
        let resp = await cognitoidentityserviceprovider.adminUpdateUserAttributes(params).promise();
        console.log(resp);
    }

    async checkIfUserExists(poolid, uuid) {
        var params = {
            UserPoolId: poolid, /* required */
            Username: uuid /* required */
        };
        let resp = await cognitoidentityserviceprovider.adminGetUser(params).promise();
        console.log("get user resp");
        console.log(resp);
        if (resp && 'Username' in resp) {
            return true;
        }
        else {
            return false;
        }
    }

    async process(event, context, callback) {
        try {
            let body = event.body ? JSON.parse(event.body) : event;
            //Validate the input
            await utils.validate(body, this.getValidationSchema());

            //check path parameters
            if (!(event && 'pathParameters' in event && event.pathParameters && 'poolid' in event.pathParameters && event.pathParameters.poolid)) {
                return responseHandler.callbackRespondWithSimpleMessage(404, "Please provide poolid");

            }
            if (!(event && 'pathParameters' in event && event.pathParameters && 'uuid' in event.pathParameters && event.pathParameters.uuid)) {
                return responseHandler.callbackRespondWithSimpleMessage(404, "Please provide uuid");

            }
            //check if user exists
            let poolid = event.pathParameters.poolid;
            let uuid = event.pathParameters.uuid;
            let respgetuser = await this.checkIfUserExists(poolid, uuid);
            // Call to insert user
            if (respgetuser) {
                let respuser = await this.updateUser(poolid, uuid, body);
            } else {
                return responseHandler.callbackRespondWithSimpleMessage(404, "User does not exists");
            }

            let resp = {    
                uuid: uuid,
                message: "User updated Successfully"
            }
            return responseHandler.callbackRespondWithSimpleMessage(200, resp);
        }
        catch (err) {
            if (err.message) {
                return responseHandler.callbackRespondWithSimpleMessage(400, err.message);
            } else {
                return responseHandler.callbackRespondWithSimpleMessage(500, 'Internal Server Error')
            }
        }
    };
}

exports.updateuser = async (event, context, callback) => {
    return await new UpdateUser().handler(event, context, callback);
}