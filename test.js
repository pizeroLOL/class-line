console.log(
  "10:23:34"
    .split(":")
    .reverse()
    .reduce((acc, now, id) => {
      console.log(acc, now, id, Math.pow(60, id));
      return acc + Math.pow(60, id) * parseInt(now);
    }, 0),
  10 * 60 * 60 + 23 * 60 + 34,
);
