"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imagekitUpload = void 0;
const imagekit_1 = __importDefault(require("imagekit"));
const env_1 = __importDefault(require("./env"));
const imagekit = new imagekit_1.default({
    publicKey: env_1.default.IMAGEKIT_PUBLIC_KEY,
    privateKey: env_1.default.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: env_1.default.IMAGEKIT_URL_ENDPOINT,
});
const imagekitUpload = (imagePath, height, width) => {
    const imageUrl = imagekit.url({
        path: imagePath,
        urlEndpoint: `${env_1.default.IMAGEKIT_URL_ENDPOINT}/endpoint/`,
        transformation: [
            {
                height: height,
                width: width,
            },
        ],
    });
    return imageUrl;
};
exports.imagekitUpload = imagekitUpload;
