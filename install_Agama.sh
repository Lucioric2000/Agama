#!/bin/bash
agamamatch=`expr match "$(pwd)" '.*\([Aa]gama\)'`
if [[ -z $agamamatch ]]
then
    git clone --recursive https://github.com/KomodoPlatform/Agama
    cd Agama
fi

git checkout dev
./binary_artifacts.sh
npm install
cd gui
if [[ -d EasyDEX-GUI ]]
then
	echo The EasyDEX-GUI dir already existed
else
	git clone https://github.com/KomodoPlatform/EasyDEX-GUI
fi
cd EasyDEX-GUI/react
git checkout dev
npm install
