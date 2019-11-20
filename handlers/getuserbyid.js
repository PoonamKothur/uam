const responseHandler = require("../common/responsehandler");
const BaseHandler = require("../common/basehandler");
const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();

class GetUserbyId extends BaseHandler {
    //this is main function
    constructor() {
        super();
    }

    async getUserByuid(uuid) {
        const params = {
            Key:{
                "uuid" : uuid
                },
            TableName: `users-${process.env.STAGE}`
        };
        return await documentClient.get(params).promise();
    }

    async process(event, context, callback) {
        try {
       
            if (event && 'pathParameters' in event && event.pathParameters && 'uuid' in event.pathParameters && event.pathParameters.uuid) {
                let uuid = event.pathParameters.uuid;
                let res = await this.getUserByuid(uuid);
                if (res && 'Item' in res) {
                    return responseHandler.callbackRespondWithJsonBody(200, res.Item);
                }
                return responseHandler.callbackRespondWithSimpleMessage(404, "No user found !");
            }
            else{
                return responseHandler.callbackRespondWithSimpleMessage(400,"Please provide Id");
            }
        }

        catch (err) {
            if (err.message) {
                return responseHandler.callbackRespondWithSimpleMessage(400, err.message);
            } else {
                return responseHandler.callbackRespondWithSimpleMessage(500, 'Internal Server Error')
            }
        }
    }
}

exports.getuser = async (event, context, callback) => {
    return await new GetUserbyId().handler(event, context, callback);
}