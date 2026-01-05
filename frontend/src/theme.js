import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  fonts: {
    heading: "'Poppins', sans-serif",
    body: "'Poppins', sans-serif",
  },
  styles: {
    global: {
      "input[type=password]::-ms-reveal, input[type=password]::-ms-clear": {
        display: "none",
      },
    },
  },
});

export default theme;
