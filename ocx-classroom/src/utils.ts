import _ from "lodash";

export function logError({ errors }) {
  return errors?.forEach(({ message }) => {
    console.log(message);
  });
}

export async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

export function clearStr(str: string): string {
  return _.trim(str || "")
    .replace(/\n\s+\n/g, "\n\n")
    .replace(/\n{3,12}/g, "\n\n");
}
