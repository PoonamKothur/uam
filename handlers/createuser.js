const responseHandler = require("../common/responsehandler");
const BaseHandler = require("../common/basehandler");
const utils = require('../common/utils');
const Joi = require('joi');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

class AddUser extends BaseHandler {
    //this is main function
    constructor() {
        super();
    }

    generateRandomuuid(min, max) {
        return (Math.random().toString(36).substring(min, max) + Math.random().toString(36).substring(min, max)).toUpperCase();
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

    //values insert if user does not exists
    async createUser(poolid, body) {
        console.log("in create user");
        const uuid = this.generateRandomuuid(2, 6);
        var params = {
            UserPoolId: poolid, /* required */
            Username: uuid, /* required */
            UserAttributes: [
                {
                    Name: 'given_name', /* required */
                    Value: body.user.firstName
                },
                {
                    Name: 'family_name', /* required */
                    Value: body.user.lastName
                },
                {
                    Name: 'email', /* required */
                    Value: body.user.email
                },
                // { 
                //     Name: 'phone_number', /* required */   // TODO phone no format
                //     Value: body.user.phone
                // },
                /* more items */
            ],
        };
        console.log(params);
        let respuuid = await cognitoidentityserviceprovider.adminCreateUser(params).promise();
        console.log("after user creation");
        if (respuuid && 'User' in respuuid) {
            console.log(respuuid);
            return respuuid.User.Username;
        }
        else {
            return responseHandler.callbackRespondWithSimpleMessage(404, 'User not created')
        }
    }

    async getResources(cuid) {
        console.log("in get resources");
        let name = `${cuid}-userpool`;
        console.log(name);

        var params = {
            TableName: `customer-resources-${process.env.STAGE}`,
            Key: {
                "name": name
            }
        };
        let valRes = await dynamodb.get(params).promise();
        console.log("response from get");
        //console.log(valRes.Item.attributes.poolid);
        if (valRes && 'Item' in valRes && valRes.Item && 'name' in valRes.Item && valRes.Item.name) {
            return valRes.Item.attributes.poolid;
        }
        else {
            return responseHandler.callbackRespondWithSimpleMessage(404, 'Userpool not created')
        }
    }

    async addusertogroups(role, poolid, uuid) {
        var params = {
            GroupName: role, /* required */
            UserPoolId: poolid, /* required */
            Username: uuid /* required */
        };
        let res = await cognitoidentityserviceprovider.adminAddUserToGroup(params).promise();
        console.log("add user to group");
        console.log(JSON.stringify(res));
        // if(){
                //TODO check response
        // }
    }

    async process(event, context, callback) {
        try {
            console.log("in process");
            let body = event.body ? JSON.parse(event.body) : event;
            console.log(JSON.stringify(body));
            //Validate the input
            await utils.validate(body, this.getValidationSchema());

            //get userpoolid from customerresources table
            let poolid = await this.getResources(body.cuid);
            console.log("before call to insert");
            console.log(poolid);
            // Call to create user

            let userRes = await this.createUser(poolid, body);
         
            console.log(userRes);
            console.log("before creation of user to group");
            let grpname = `${body.cuid}-${body.role}`
            let groupres = await this.addusertogroups(grpname, poolid, userRes);

            let resp = {
                uuid: this.uuid,
                message: "User Created Successfully"
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

exports.createuser = async (event, context, callback) => {
    return await new AddUser().handler(event, context, callback);
}