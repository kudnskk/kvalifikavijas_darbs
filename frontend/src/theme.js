import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  fonts: {
    heading: "'Poppins', sans-serif",
    body: "'Poppins', sans-serif",
  },
  styles: {
    global: {
      // Hide password reveal buttons
      "input[type=password]::-ms-reveal, input[type=password]::-ms-clear": {
        display: "none",
      },
      // changed scrollbar desgin to be semitransperent
      "*": {
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255, 255, 255, 0.2) transparent",
      },
      "*::-webkit-scrollbar": {
        width: "6px",
        height: "6px",
      },
      "*::-webkit-scrollbar-track": {
        background: "transparent",
      },
      "*::-webkit-scrollbar-thumb": {
        background: "rgba(255, 255, 255, 0.2)",
        borderRadius: "3px",
      },
      "*::-webkit-scrollbar-thumb:hover": {
        background: "rgba(255, 255, 255, 0.3)",
      },
    },
  },
});

export default theme;
