const responseHandler = require("../common/responsehandler");
const BaseHandler = require("../common/basehandler");
const utils = require('../common/utils');
const Joi = require('joi');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

class AddUser extends BaseHandler {
    //this is main function
    constructor() {
        super();
    }

    generateRandomuuid(min, max) {
        return (Math.random().toString(36).substring(min, max) + Math.random().toString(36).substring(min, max)).toUpperCase();
    }

    // getValidationSchema() {
    //     this.log.info('Inside getValidationSchema');

    //     return Joi.object().keys({
    //         cid: Joi.string().required(),
    //         cuid: Joi.string().required(),
    //         eid: Joi.string().required(),
    //         euid: Joi.string().required(),
    //         role: Joi.string().required(),
    //         user: {
    //             firstName: Joi.string().required(),
    //             lastName: Joi.string().required(),
    //             email: Joi.string().email().required(),
    //             phone: Joi.string(),
    //             creation: Joi.date(),
    //             lastsignin: Joi.date(),
    //             lastvisit: Joi.date()
    //         }
    //     });
    // }

    //values insert if user does not exists
    async createUser(poolid,body) {
        console.log("in create user");
        const uuid = this.generateRandomuuid(2, 6);
        var params = {
            UserPoolId: poolid, /* required */
            Username:  generateRandomuuid(2,6), /* required */
            UserAttributes: [
                {
                    Name: 'cuid', /* required */
                    Value: body.cuid
                },
                /* more items */
            ],
        };

        console.log(params);

        return uuid;
    }

    async getResources(cuid, type) {
        console.log("in get resources");
        let name = `${cuid}-${type}`;
        console.log(name);

        var params = {
            TableName: table,
            Key: {
                "name": name
            }
        };
        let res = await docClient.get(params).promise();
        // if(res){

        // }
        console.log("response from get");
        console.log(res);
        console.log(res.attributes.poolid);
    }

    async process(event, context, callback) {
        try {
            let body = event.body ? JSON.parse(event.body) : event;
            //Validate the input
            await utils.validate(body, this.getValidationSchema());

            //get userpoolid from customerresources table
            let poolid = await this.getResources(body.cuid, body.type);

            // Call to create user
            if (name){
                let uuid = await this.createUser(poolid,body);
                console.log(uuid);
            }
            
            // let resp = {
            //     uuid: uuid,
            //     message: "User Created Successfully"
            // }
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

exports.createuser = async (event, context, callback) => {
    return await new AddUser().handler(event, context, callback);
}