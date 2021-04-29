export function logError({ errors }) {
  return errors?.forEach(({ message }) => {
    console.log(message);
  });
}

export async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
