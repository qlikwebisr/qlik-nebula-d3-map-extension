// This file defines the data requirements for our extension
export default {
  targets: [
    {
      path: "/qHyperCubeDef",
      dimensions: {
        min: 1, // State name or code
        max: 1,
      },
      measures: {
        min: 1, // Value to visualize (will be shown as color intensity)
        max: 1,
      },
    },
  ],
};