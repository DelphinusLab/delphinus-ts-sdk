/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { SxProps, Theme } from "@mui/material/styles";
import { styled } from "@mui/material/styles";
import { capNumber } from "./helpers/helper";
import Address from "./address";
import { State } from "./accountSlice";

import {
  loginL1AccountAsync,
  loginL2AccountAsync,
  selectLoginStatus,
  selectL1Account,
  selectL2Account,
} from "../lib/accountSlice";
import {
  L1AccountInfo,
  SubstrateAccountInfo,
  TokenInfo,
  TokenInfoFull,
} from "./type";
import { AsyncThunkAction } from "@reduxjs/toolkit";
import BN from "bn.js";
import { fromPreciseWeiRepr } from "./amount";

const style: SxProps<Theme> = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  outline: 0,
  p: 4,
};

export const TxDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

export interface DialogTitleProps {
  id: string;
  children?: React.ReactNode;
}

export const TxDialogTitle = (props: DialogTitleProps) => {
  const { children, ...other } = props;

  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
    </DialogTitle>
  );
};

// href="https://metamask.io/download"

export interface ButtonProps {
  text?: string;
  icon?: string;
  hidden?: boolean;
  style?: React.CSSProperties;
  children?: any;
  ignoreButtonIcon?: boolean;
}

interface IProps {
  button1Props?: ButtonProps;
  button2Props?: ButtonProps;
  name?: string;
  logo?: string;
  useCustomStyles?: boolean;
  children?: any;
  onClose?: () => void;
}

export function SetAccount(props: IProps) {
  const { button1Props, button2Props } = props;
  const l1Account = useSelector<State, L1AccountInfo | undefined>(
    selectL1Account
  );
  const l2Account = useSelector<State, SubstrateAccountInfo | undefined>(
    selectL2Account
  );
  const status = useSelector<State, string>(selectLoginStatus);
  const dispatch = useDispatch<(_: AsyncThunkAction<any, any, {}>) => void>();

  const ButtonGroup = () => {
    return (
      <>
        {l1Account === undefined && (
          <Button
            className="home-btn"
            startIcon={
              !button1Props?.ignoreButtonIcon && (
                <img
                  src={button1Props?.icon ? button1Props?.icon : undefined}
                  className="chain-icon"
                ></img>
              )
            }
            variant="contained"
            onClick={() => dispatch(loginL1AccountAsync())}
          >
            {button1Props?.text ? button1Props?.text : "Connect Wallet"}
          </Button>
        )}
        {l1Account && (
          <Button
            startIcon={
              !button1Props?.ignoreButtonIcon && (
                <img
                  src={button1Props?.icon ? button1Props?.icon : undefined}
                  className="chain-icon"
                ></img>
              )
            }
            className="home-btn"
            variant="contained"
            disabled
          >
            <Address address={l1Account!.address}></Address>
            {button1Props?.children ? button1Props.children : null}
          </Button>
        )}
        {!button2Props?.hidden && (
          <Button
            style={button2Props?.style}
            disabled={l1Account === undefined}
            startIcon={
              !button2Props?.ignoreButtonIcon && (
                <img
                  src={button2Props?.icon ? button2Props?.icon : undefined}
                  className="chain-icon"
                ></img>
              )
            }
            className="home-btn"
            variant="contained"
            onClick={() =>
              l1Account && dispatch(loginL2AccountAsync(l1Account.address))
            }
          >
            {button2Props?.text ? button2Props?.text : "Sign In"}
          </Button>
        )}
      </>
    );
  };

  return (
    <TxDialog
      open={status !== "Ready"}
      aria-labelledby="customized-dialog-title"
    >
      {props.name && (
        <TxDialogTitle id="customized-dialog-title">{props.name}</TxDialogTitle>
      )}

      <DialogContent>
        {props.useCustomStyles && props.logo && (
          <div className="home-title">
            <img src={props.logo} className="home-logo"></img>
          </div>
        )}
        {props.children && (
          <div className="home-children">{props.children}</div>
        )}
        <DialogActions>
          {props.useCustomStyles && (
            <div className="home-btn-wrapper">
              <ButtonGroup></ButtonGroup>
            </div>
          )}
          {!props.useCustomStyles && <ButtonGroup></ButtonGroup>}
        </DialogActions>
      </DialogContent>
    </TxDialog>
  );
}

interface amountElementProps {
  amount?: BN;
  token: TokenInfo | TokenInfoFull;
}

export function AmountElement(props: amountElementProps) {
  if (props.amount) {
    let a = fromPreciseWeiRepr(props.amount, props.token.wei);

    return <>{capNumber(a.amount)}</>;
  } else {
    return <>loading...</>;
  }
}
