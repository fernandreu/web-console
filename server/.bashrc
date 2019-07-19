#!/bin/bash

# trap ctrl-c and call ctrl_c()
trap ctrl_c INT

function ctrl_c() {
  echo
  echo Login aborted. Exiting...
  exit
}

. $HOME/.bashrc
read -s -p "Password: " pass
echo
if [ $pass != "gatito" ]
then
   echo Invalid password. Exiting...
   exit
fi

cd $HOME

trap - INT
