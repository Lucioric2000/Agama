const fs = require('fs-extra');
const path = require('path');
let _foldersInitRan = false;

module.exports = (shepherd) => {
  shepherd.readVersionFile = () => {
    // read app version
    const rootLocation = path.join(__dirname, '../../');
    const localVersionFile = fs.readFileSync(`${rootLocation}version`, 'utf8');

    return localVersionFile;
  }

  shepherd.createAgamaDirs = () => {
    if (!_foldersInitRan) {
      const rootLocation = path.join(__dirname, '../../');

      fs.readdir(rootLocation, (err, items) => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].substr(0, 3) === 'gen') {
            shepherd.log(`remove ${items[i]}`, 'init');
            fs.unlinkSync(rootLocation + items[i]);
          }
        }
      });

      if (!fs.existsSync(shepherd.agamaDir)) {
        fs.mkdirSync(shepherd.agamaDir);

        if (fs.existsSync(shepherd.agamaDir)) {
          shepherd.log(`created agama folder at ${shepherd.agamaDir}`, 'init');
          shepherd.writeLog(`created agama folder at ${shepherd.agamaDir}`);
        }
      } else {
        shepherd.log('agama folder already exists', 'init');
      }

      if (!fs.existsSync(`${shepherd.agamaDir}/shepherd`)) {
        fs.mkdirSync(`${shepherd.agamaDir}/shepherd`);

        if (fs.existsSync(`${shepherd.agamaDir}/shepherd`)) {
          shepherd.log(`created shepherd folder at ${shepherd.agamaDir}/shepherd`, 'init');
          shepherd.writeLog(`create shepherd folder at ${shepherd.agamaDir}/shepherd`);
        }
      } else {
        shepherd.log('agama/shepherd folder already exists', 'init');
      }

      const _subFolders = [
        'pin',
        'csv',
        'log',
      ];

      for (let i = 0; i < _subFolders.length; i++) {
        if (!fs.existsSync(`${shepherd.agamaDir}/shepherd/${_subFolders[i]}`)) {
          fs.mkdirSync(`${shepherd.agamaDir}/shepherd/${_subFolders[i]}`);

          if (fs.existsSync(`${shepherd.agamaDir}/shepherd/${_subFolders[i]}`)) {
            shepherd.log(`created ${_subFolders[i]} folder at ${shepherd.agamaDir}/shepherd/${_subFolders[i]}`, 'init');
            shepherd.writeLog(`create ${_subFolders[i]} folder at ${shepherd.agamaDir}/shepherd/${_subFolders[i]}`);
          }
        } else {
          shepherd.log(`shepherd/${_subFolders[i]} folder already exists`, 'init');
        }
      }

      if (!fs.existsSync(shepherd.zcashParamsDir)) {
        fs.mkdirSync(shepherd.zcashParamsDir);
      } else {
        shepherd.log('zcashparams folder already exists', 'init');
      }

      _foldersInitRan = true;
    }
  }

  return shepherd;
};