/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { useSelector, useDispatch } from "react-redux";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Modal from "@mui/material/Modal";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { SxProps, Theme } from "@mui/material/styles";
import { styled } from '@mui/material/styles';

import MetaMaskLogo from "../icons/metamask.svg";
import PolkaLogo from "../icons/polka.svg";
import Address from "./address";
import { State } from "./accountSlice";

import {
  loginL1AccountAsync,
  loginL2AccountAsync,
  selectLoginStatus,
  selectL1Account,
  selectL2Account,
} from "../lib/accountSlice";
import { L1AccountInfo, SubstrateAccountInfo } from "./type";
import { AsyncThunkAction } from "@reduxjs/toolkit";

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
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
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
  name: string;
  children: any;
}

export function SetAccount(props: IProps) {
  const l1Account = useSelector<State, L1AccountInfo | undefined>(
    selectL1Account
  );
  const l2Account = useSelector<State, SubstrateAccountInfo | undefined>(
    selectL2Account
  );
  const status = useSelector<State, string>(selectLoginStatus);
  const dispatch = useDispatch<(_: AsyncThunkAction<any, any, {}>) => void>();

  return (
    <TxDialog
      open={status !== "Ready"}
      aria-labelledby="customized-dialog-title"
    >
      <TxDialogTitle id="customized-dialog-title" >
        {props.name}
      </TxDialogTitle>
      <DialogContent>
        {props.children}
        <DialogActions>
          {l1Account === undefined && (
            <Button
              startIcon={<img src={MetaMaskLogo} className="chain-icon"></img>}
              variant="contained"
              onClick={() => dispatch(loginL1AccountAsync())}
            >
              Connect Wallet
            </Button>
          )}
          {l1Account && (
            <Button
              startIcon={<img src={MetaMaskLogo} className="chain-icon"></img>}
              variant="contained"
              disabled
            >
              <Address address={l1Account!.address}></Address>
            </Button>
          )}
          {
            <Button
              disabled={l1Account === undefined}
              startIcon={<img src={PolkaLogo} className="chain-icon"></img>}
              variant="contained"
              onClick={() =>
                l1Account && dispatch(loginL2AccountAsync(l1Account.address))
              }
            >
              Sign In
            </Button>
          }
        </DialogActions>
      </DialogContent>
    </TxDialog>
  );
}
