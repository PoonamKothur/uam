const responseHandler = require("../common/responsehandler");
const BaseHandler = require("../common/basehandler");
const AWS = require('aws-sdk');
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

class GetUserbyId extends BaseHandler {
    //this is main function
    constructor() {
        super();
    }

    async getUserByuid(uuid) {
        var params = {
            UserPoolId: 'STRING_VALUE', /* required */
            Username: 'STRING_VALUE' /* required */
          };
       let resp = await   cognitoidentityserviceprovider.adminGetUser(params).promise();
       console.log("get user resp");
       console.log(resp);
    }

    async process(event, context, callback) {
        try {
            //check for cuid
            if (!(event && 'pathParameters' in event && event.pathParameters && 'cuid' in event.pathParameters && event.pathParameters.cuid)) {
                return responseHandler.callbackRespondWithSimpleMessage(400, "Please provide cuid");
            }

            //check for poolid
            if (!(event && 'pathParameters' in event && event.pathParameters && 'poolid' in event.pathParameters && event.pathParameters.poolid)) {

                return responseHandler.callbackRespondWithSimpleMessage(400, "Please provide poolid");
            }

            //check for uuid
            if (!(event && 'pathParameters' in event && event.pathParameters && 'uuid' in event.pathParameters && event.pathParameters.uuid)) {

                return responseHandler.callbackRespondWithSimpleMessage(400, "Please provide uuid");
            }

            //get user by id
            let cuid = event.pathParameters.cuid;
            let poolid = event.pathParameters.poolid;
            let uuid = event.pathParameters.uuid;

            let res = await getUserByuid(cuid,poolid,uuid);
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