"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delData = exports.getData = exports.setData = void 0;
const database_1 = require("../database");
const setData = async (data, exp = 1800) => {
    try {
        const key = `user:${data._id}`;
        const value = JSON.stringify(data);
        return await database_1.redis?.set(key, value, "EX", exp);
    }
    catch (error) {
        return null;
    }
};
exports.setData = setData;
const getData = async (uid) => {
    try {
        const key = `user:${uid}`;
        const data = await database_1.redis?.get(key);
        if (!data)
            return null;
        return JSON.parse(data);
    }
    catch (error) {
        return null;
    }
};
exports.getData = getData;
const delData = async (uid) => {
    try {
        const key = `user:${uid}`;
        return await database_1.redis?.del(key);
    }
    catch (error) {
        return null;
    }
};
exports.delData = delData;
