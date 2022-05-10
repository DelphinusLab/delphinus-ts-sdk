/* eslint-disable jsx-a11y/alt-text */
import React, { Suspense } from "react";
import { useSelector, useDispatch } from "react-redux";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { SxProps, Theme } from "@mui/material/styles";
import { styled } from "@mui/material/styles";

import { State } from "./accountSlice";

import Default from "./logins/main/default";

import {
  loginL1AccountAsync,
  loginL2AccountAsync,
  selectLoginStatus,
  selectL1Account,
  selectL2Account,
} from "../lib/accountSlice";
import { L1AccountInfo, SubstrateAccountInfo } from "./type";
import { AsyncThunkAction } from "@reduxjs/toolkit";

const LoginScreen =
  require(`./logins/main/${process.env.REACT_APP_UI_CLIENT}`).default;

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
  client?: string;
  name?: string;
  logoSVG?: string;
  useCustomStyles?: boolean;
  ignoreButtonIcon?: boolean;
  l2Icon?: string;
  l2Text?: string;
  children?: any;
  onClose?: () => void;
}

export function SetAccount(props: IProps) {
  const { client } = props;
  const l1Account = useSelector<State, L1AccountInfo | undefined>(
    selectL1Account
  );
  const l2Account = useSelector<State, SubstrateAccountInfo | undefined>(
    selectL2Account
  );
  const status = useSelector<State, string>(selectLoginStatus);
  const dispatch = useDispatch<(_: AsyncThunkAction<any, any, {}>) => void>();

  //dispatch account related actions from here
  const loginL1 = () => {
    console.log("Login L1");
    dispatch(loginL1AccountAsync());
  };
  const loginL2 = () => {
    console.log("Login L2");
    l1Account && dispatch(loginL2AccountAsync(l1Account.address));
  };

  //const CurrentLogin = Logins[`${client?.toUpperCase()}`];

  return (
    <>
      <LoginScreen l1Login={loginL1} l2Login={loginL2}></LoginScreen>
    </>
  );
}
