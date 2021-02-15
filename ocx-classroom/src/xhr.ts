import { GenericObject } from "src/types";

export const getRequest = async (url: string): Promise<GenericObject> => {
  const response = await fetch(url);
  return await response.json();
};

export const postRequest = async (url: string, data: GenericObject): Promise<GenericObject> => {
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  });
  return await response.json();
};
