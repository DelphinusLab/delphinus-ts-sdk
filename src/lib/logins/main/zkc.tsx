/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import Box from "@mui/material/Box";
import LoginButton from "../components/button";
import Stack from "@mui/material/Stack";
import Modal from "@mui/material/Modal";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { SxProps, Theme } from "@mui/material/styles";
import { styled } from "@mui/material/styles";

import MetaMaskLogo from "../../../icons/metamask.svg";
import PolkaLogo from "../../../icons/polka.svg";
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
import { AsyncThunkAction } from "@reduxjs/toolkit";

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

interface IProps {}

export default function Login() {
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
          <LoginButton
            icon={MetaMaskLogo}
            text="Connect Wallet"
            disabled={false}
            onClick={() => dispatch(loginL1AccountAsync())}
          ></LoginButton>
        )}
        {l1Account && (
          <LoginButton
            icon={MetaMaskLogo}
            text={l1Account!.address}
            disabled={true}
          ></LoginButton>
        )}
        {
          <LoginButton
            icon={PolkaLogo}
            text="Connect L2 Wallet"
            disabled={l1Account === undefined}
            onClick={() =>
              l1Account && dispatch(loginL2AccountAsync(l1Account.address))
            }
          ></LoginButton>
        }
      </>
    );
  };

  return (
    <>
      <TxDialog
        open={status !== "Ready"}
        aria-labelledby="customized-dialog-title"
      >
        <TxDialogTitle id="customized-dialog-title">ZKCross</TxDialogTitle>

        {/* <div className="home-title">
          <img src={props.logoSVG} className="home-logo"></img>
        </div> */}

        <DialogContent>
          <div className="home-children">ZKCross Wallet</div>

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
