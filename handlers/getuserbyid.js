const responseHandler = require("../common/responsehandler");
const BaseHandler = require("../common/basehandler");
const AWS = require('aws-sdk');
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

class GetUserbyId extends BaseHandler {
    //this is main function
    constructor() {
        super();
    }

    async getUserByuid(poolid, uuid) {
        var params = {
            UserPoolId: poolid, /* required */
            Username: uuid /* required */
        };
        let resp = await cognitoidentityserviceprovider.adminGetUser(params).promise();
        console.log("get user resp");
        console.log(resp);
        return(resp);
    }

    async process(event, context, callback) {
        try {

            //check for poolid in path parameters
            if (!(event && 'pathParameters' in event && event.pathParameters && 'poolid' in event.pathParameters && event.pathParameters.poolid)) {
                return responseHandler.callbackRespondWithSimpleMessage(400, "Please provide poolid");
            }
            //check for uuid in path parameters
            if (!(event && 'pathParameters' in event && event.pathParameters && 'uuid' in event.pathParameters && event.pathParameters.uuid)) {
                return responseHandler.callbackRespondWithSimpleMessage(400, "Please provide uuid");
            }

            //get user by id
            let poolid = event.pathParameters.poolid;
            let uuid = event.pathParameters.uuid;

            let res = await this.getUserByuid(poolid, uuid);
            if (res && 'User' in res) {
                console.log(res);
                return res.User.Username;
            }
            else {
                return responseHandler.callbackRespondWithSimpleMessage(404, 'User not exists')
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