const responseHandler = require("../common/responsehandler");
const BaseHandler = require("../common/basehandler");
const utils = require('../common/utils');
const Joi = require('joi');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

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
    async updateUser(uuid, data) {
        let item = {
            uuid: uuid
        }
        const params = {
            TableName: `${process.env.STAGE}-users`,
            Item: Object.assign(item, data)
        };
        let valRes = await dynamodb.put(params).promise();
        return uuid;
    }

    async checkIfUserExists(uuid) {
        let valRes = await dynamodb.get({
            TableName: `${process.env.STAGE}-users`,
            Key: {
                uuid: uuid
            },
            ProjectionExpression: 'uuid'
        }).promise();
        this.log.debug(JSON.stringify(valRes));
        if (valRes && 'Item' in valRes && valRes.Item && 'uuid' in valRes.Item && valRes.Item.uuid) {
            return true;
        } else {
            return false;
        }
    }

    async process(event, context, callback) {
        try {
            let body = event.body ? JSON.parse(event.body) : event;
            //Validate the input
            await utils.validate(body, this.getValidationSchema());

            //check if user exists
            if (event && 'pathParameters' in event && event.pathParameters && 'uuid' in event.pathParameters && event.pathParameters.uuid) {
                let uuid = await this.checkIfUserExists(uuid);
            }
            else {
                return responseHandler.callbackRespondWithSimpleMessage(400, "Please provide uuid");
            }
            // Call to insert user
            let uuid = await this.updateUser(uuid, body);
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