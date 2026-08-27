import React from "react";
import { createRoot } from "react-dom/client";
import CourseCanvas from "./CourseCanvas.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CourseCanvas />
  </React.StrictMode>
);
