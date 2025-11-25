import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client"; 
import { HashRouter, Navigate, Routes, Route } from "react-router-dom";
import { ChakraProvider } from '@chakra-ui/react'
const root = ReactDOM.createRoot(document.getElementById("root")); 

root.render(
 
     <ChakraProvider  >
    
    <HashRouter>
      <Routes>
      </Routes>
    </HashRouter>
    </ChakraProvider>

);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
