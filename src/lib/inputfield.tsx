import react from "react";
import TextField from "@mui/material/TextField";

interface InputProps {
  wei?: number;
  className?: string;
  value: string;
  disabled?: boolean;
  style?: react.CSSProperties;
  label?: string;
  onChange: (e: any) => void;
}

export default function InputField(props: InputProps) {
  //maxlen is roughly theoretical solidity max number (2^256)

  const RestrictNonNumeric = (e: any) => {
    const re = /^\d*\.?\d*$/; //regex for decimal number with optional exponent
    // if value is not blank, then test the regex

    if (e.target.value === "" || re.test(e.target.value)) {
      props.onChange(e);
    }
  };

  return (
    <TextField
      className={props.className!}
      autoFocus
      margin="dense"
      disabled={props.disabled!}
      label={props.label ? props.label : "Label"}
      fullWidth
      variant="standard"
      type="text"
      style={props.style!}
      value={props.value}
      onChange={RestrictNonNumeric}
    ></TextField>
  );
}
