git clone https://github.com/komodoplatform/agama
cd agama
git checkout dev
./binary_artifacts.sh
npm install
cd gui
git clone https://github.com/KomodoPlatform/EasyDEX-GUI
cd EasyDEX-GUI/react
git checkout dev
npm install