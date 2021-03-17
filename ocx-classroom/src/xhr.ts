import { GenericObject } from "src/types";

export let getRequest = async (url: string): Promise<GenericObject> => {
  let response = await fetch(url);
  return await response.json();
};

export let postRequest = async (url: string, data: GenericObject): Promise<GenericObject> => {
  let response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  });
  return await response.json();
};
