import { GenericObject } from "src/types";

export async function getRequest(url: string): Promise<GenericObject> {
  let response = await fetch(url);
  return await response.json();
}

export async function postRequest(url: string, data: GenericObject): Promise<GenericObject> {
  let response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  });
  return await response.json();
}
