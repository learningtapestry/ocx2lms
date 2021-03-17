export let logError = ({ errors }) =>
  errors?.forEach(({ message }) => {
    console.log(message);
  });
