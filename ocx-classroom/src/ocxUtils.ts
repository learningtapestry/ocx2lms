import { GenericObject } from "src/types";

const JSON_LD_SELECTOR = 'script[type="application/ld+json"]';

export const getOCXjsonld = async (url: string) => {
  let parser = new DOMParser();

  let _url = url.indexOf("http://") === -1 ? "http://" + url : url;
  let response = await fetch(_url);
  let html = await response.text();

  let doc = parser.parseFromString(html, "text/html");
  let content = doc.querySelector(JSON_LD_SELECTOR).innerHTML;
  let data: GenericObject;
  try {
    data = JSON.parse(content);
  } catch (err) {
    console.log(err);
    data = {};
  }
  return data;
};
