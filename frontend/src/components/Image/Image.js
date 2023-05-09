import React from "react";
import { ROOT_BACKEND_URL } from "../../constant/path";
import "./Image.css";

const image = (props) => (
  <div
    className="image"
    style={{
      backgroundImage: `url('${props.imageUrl}')`,
      backgroundSize: props.contain ? "contain" : "cover",
      backgroundPosition: props.left ? "left" : "center",
    }}
  />
);

export default image;
