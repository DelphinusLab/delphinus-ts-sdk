// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-nocheck
import * as react from "react";
import { L1AccountInfo } from "../libs/type";
import MetaMaskLogo from "../icons/metamask.svg";
import PolkaLogo from "../icons/polka.svg";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { deriveL2Account } from "../lib/l1/account";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Address from "./address";

import {
    loginL1AccountAsync,
    loginL2AccountAsync,
    selectLoginStatus,
    selectL1Account,
    selectL2Account,
} from "../lib/accountSlice";

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  outline: 0,
  p: 4,
};

// href="https://metamask.io/download"

interface IProps {
  name: string;
  children: any;
}

export function SetAccount(props: IProps) {
  const l1Account = useAppSelector(selectL1Account);
  const l2Account = useAppSelector(selectL2Account);
  const status = useAppSelector(selectLoginStatus);
  const dispatch = useAppDispatch();
  const updateL1AccountAddress = (account) => {
    dispatch(setL1Account(account));
  }

  return (
    <Modal
      open={status != "Ready"}
      aria-labelledby="account-modal-title"
      aria-describedby="account-modal-description"
    >
      <Box sx={style}>
        <h2 id="account-modal-title">
          {props.name}
        </h2>
        <p id="account-modal-description">
        </p>
        {props.children}
        <Stack direction="row" spacing={2} alignItems="center">
        {l1Account === undefined && (
            <Button
              startIcon = {<img src={MetaMaskLogo} className="chain-icon"></img>}
              variant="contained"
              onClick = {() => dispatch(loginL1AccountAsync())}
            >
              Connect Wallet
            </Button>
        )}
        {(l1Account) && (
            <Button
              startIcon = {<img src={MetaMaskLogo} className="chain-icon"></img>}
              variant="contained"
              disabled
            >
              <Address address={l1Account!.address}></Address>
            </Button>
        )}
        {(
          <Button
            disabled = {l1Account == undefined}
            startIcon = {<img src={PolkaLogo} className="chain-icon"></img>}
            variant="contained"
            onClick={() => l1Account && dispatch(loginL2AccountAsync(l1Account.address))}
          >
              Sign In
          </Button>
        )}
        </Stack>
      </Box>
    </Modal>
  );
}
