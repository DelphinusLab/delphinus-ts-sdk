/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { useSelector, useDispatch } from "react-redux";

import LoginButton from "../components/button";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import { styled } from "@mui/material/styles";

import MetaMaskLogo from "../../../icons/metamask.svg";
import ZMorphLogo from "../../../icons/l2-logo.png";
import ZMorphLogoBig from "../../../icons/zmorph-logo-big.png";
import DownArrow from "../../../icons/down-arrow.svg";
import Address from "../../address";
import { State } from "../../accountSlice";

import {
  loginL1AccountAsync,
  loginL2AccountAsync,
  selectLoginStatus,
  selectL1Account,
  selectL2Account,
} from "../../accountSlice";
import { L1AccountInfo, SubstrateAccountInfo } from "../../type";

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

interface IProps {
  l1Login: () => void;
  l2Login: () => void;
}

export default function Login(props: IProps) {
  const l1Account = useSelector<State, L1AccountInfo | undefined>(
    selectL1Account
  );

  const status = useSelector<State, string>(selectLoginStatus);

  const ButtonGroup = () => {
    return (
      <>
        {l1Account === undefined && (
          <LoginButton
            icon={ZMorphLogo}
            disabled={false}
            onClick={props.l1Login}
          >
            Connect Wallet for Aggregate Layer (L2)
          </LoginButton>
        )}
        {l1Account && (
          <LoginButton
            icon={ZMorphLogo}
            text={l1Account!.address}
            disabled={true}
          >
            <Address address={l1Account.address}></Address>
            <img
              src={DownArrow}
              style={{ marginLeft: "auto", marginRight: "12px" }}
            ></img>
          </LoginButton>
        )}
        {l1Account && (
          <LoginButton
            text=""
            disabled={l1Account === undefined}
            onClick={props.l2Login}
            style={{ justifyContent: "center" }}
          >
            Enter Wallet
          </LoginButton>
        )}
      </>
    );
  };

  return (
    <>
      <TxDialog
        open={status !== "Ready"}
        aria-labelledby="customized-dialog-title"
      >
        <TxDialogTitle id="customized-dialog-title">
          Welcome to ZMorph Wallet
        </TxDialogTitle>

        <div className="home-title">
          <img src={ZMorphLogoBig} className="home-logo"></img>
        </div>

        <DialogContent>
          <div className="home-children">
            {l1Account
              ? "Connected Account for Aggregate Layer 2"
              : "The Most Advanced Layer 2 Wallet"}
          </div>

          <DialogActions>
            <div className="home-btn-wrapper">
              <ButtonGroup></ButtonGroup>
            </div>
          </DialogActions>
        </DialogContent>
      </TxDialog>
    </>
  );
}
