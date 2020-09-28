import dotenv from 'dotenv'
import * as path from "path";
//dotenv.config( { path: ".env" }); // env vars

//static config data
let config_data = null;

export const ServerConfig = (envconfig: string = "", jsonconfig: string = "") : any =>
{
    //if there is already config data, return it.
    if (config_data != null && config_data != undefined)
    {
        return config_data;
    }
    config_data = {};
    let env_data = {};
    let json_data = {};
    if (envconfig != "")
    {
        //load env as default
        env_data = dotenv.config( { path: envconfig }).parsed; // env vars
    }
    if (jsonconfig != "")
    {
        json_data = require(jsonconfig);   
    }

    //merge the objects
    //config_data = {...env_data, ...json_data};
    config_data = json_data;
    config_data["ENV"] = env_data;

    return config_data;
}