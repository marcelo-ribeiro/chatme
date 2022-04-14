export const generateDarkColorHsl = () => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * (100 + 1)) + "%";
  const lightness = Math.floor(Math.random() * (100 / 2 + 1)) + "%";
  return "hsl(" + hue + ", " + saturation + ", " + lightness + ")";
};

// export const generateLightColorHsl = () => {
//   const hue = Math.floor(Math.random() * 360);
//   const saturation = Math.floor(Math.random() * (100 + 1)) + "%";
//   const lightness = Math.floor((1 + Math.random()) * (100 / 2 + 1)) + "%";
//   return "hsl(" + hue + ", " + saturation + ", " + lightness + ")";
// };

export const generateLightColorHsl = () => {
  const hue = Math.floor(Math.random() * 360);
  return hue;
};
