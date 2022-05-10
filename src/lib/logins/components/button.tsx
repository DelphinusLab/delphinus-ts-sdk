import React from "react";
import Button from "@mui/material/Button";

interface IProps {
  icon?: string;
  text?: string;
  children?: any;
  disabled: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function LoginButton(props: IProps) {
  return (
    <Button
      disabled={props.disabled}
      startIcon={
        props.icon ? <img src={props.icon} className="chain-icon"></img> : null
      }
      className="home-btn"
      variant="contained"
      onClick={props.onClick}
      style={props.style!}
    >
      {props.children ? props.children : "Default Text"}
    </Button>
  );
}
