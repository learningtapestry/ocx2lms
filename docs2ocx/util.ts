export function dasherize(str: string) {
  return str
    ?.replace(/\s+/g, " ")
    ?.trim()
    ?.toLocaleLowerCase()
    ?.replace(/\s+/g, "-");
}

export function splitCommaSepValues(str: string) {
  return str
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t?.length);
}
