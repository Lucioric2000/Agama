#!/bin/bash
agamamatch=`expr match "$(pwd)" '.*\([Aa]gama\)'`
if [[ -z $agamamatch ]]
  #This IS NOT INTENDED to be run in any other submodule
then
    git clone --recursive https://github.com/Lucioric2000/Agama
    cd Agama
fi
git remote add upstream https://github.com/KomodoPlatform/Agama
git checkout fullapidev
git pull upstream dev
git merge dev
echo estamos en $(pwd)
npm install
npm install webpack@3.0.0 webpack-cli@3.0.0
./binary_artifacts.sh
#npm start
cd gui
echo cdggui in $(pwd)
if [[ -d EasyDEX-GUI ]]
then
  echo The EasyDEX-GUI dir already existed
  cd EasyDEX-GUI/react
  echo edx0 en $(pwd)
else
  git clone https://github.com/Lucioric2000/EasyDEX-GUI
  cd EasyDEX-GUI/react
fi
echo edx en $(pwd)
git remote add upstream https://github.com/KomodoPlatform/EasyDEX-GUI
git checkout dev
git pull upstream dev
#npm install electron-packager electron-prebuilt
sudo /usr/local/bin/node /usr/local/bin/npm install -g electron-packager
npm install electron
npm install
pwd
cd src
npm install
#npm start
cd ../../../../
echo entonces en
pwd
#npm install electron-prebuilt
#Detect OS and run the adequate builder
os=${OSTYPE//[0-9.-]*/}

case "$os" in
  darwin)
    echo "I'm a Mac. ¿Do I need to run more steps?."
    ;;

  msys)
    echo "I'm Windows using git bash. ¿Do I need to run more steps?.";
  ;;
  linux)
    echo "Building on Linux"
    ./build-linux.sh $(python ../buildscripts/devversion.py version)
    ;;
  *)

  echo "Unknown Operating system $OSTYPE"
  exit 1
esac
