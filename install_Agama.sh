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
git clone https://github.com/KomodoPlatform/EasyDEX-GUI
cd EasyDEX-GUI/react
git checkout dev
npm install
cd ../../../
##Detect OS and run the adequate builder
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
	./build-linux.sh 0.2.44-beta
	;;
  *)

  echo "Unknown Operating system $OSTYPE"
  exit 1
esac

