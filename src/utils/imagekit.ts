import ImageKit from "imagekit";
import env from "./env";

const imagekit = new ImageKit({
  publicKey: env.IMAGEKIT_PUBLIC_KEY,
  privateKey: env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
});

const imagekitUpload = (imagePath: string, height?: "300", width?: "300") => {
  const imageUrl = imagekit.url({
    path: imagePath,
    urlEndpoint: `${env.IMAGEKIT_URL_ENDPOINT}/endpoint/`,
    transformation: [
      {
        height: height,
        width: width,
      },
    ],
  });
  return imageUrl;
};

export { imagekitUpload };
