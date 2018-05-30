const fs = require('fs-extra');
const _fs = require('graceful-fs');
const fsnode = require('fs');
const Promise = require('bluebird');

module.exports = (shepherd) => {
  shepherd.loadElectrumServersList = () => {
    if (fs.existsSync(`${shepherd.agamaDir}/electrumServers.json`)) {
      const localElectrumServersList = fs.readFileSync(`${shepherd.agamaDir}/electrumServers.json`, 'utf8');

      shepherd.log('electrum servers list set from local file');
      shepherd.writeLog('electrum servers list set from local file');

      try {
        shepherd.electrumServers = JSON.parse(localElectrumServersList);
      } catch (e) {}
    } else {
      shepherd.log('local electrum servers list file is not found!');
      shepherd.writeLog('local lectrum servers list file is not found!');

      shepherd.saveElectrumServersList();
    }
  };

  shepherd.saveElectrumServersList = (list) => {
    const electrumServersListFileName = `${shepherd.agamaDir}/electrumServers.json`;

    if (!list) {
      list = shepherd.electrumServers;
    }

    _fs.access(shepherd.agamaDir, shepherd.fs.constants.R_OK, (err) => {
      if (!err) {
        const FixFilePermissions = () => {
          return new Promise((resolve, reject) => {
            const result = 'electrumServers.json file permissions updated to Read/Write';

            fsnode.chmodSync(electrumServersListFileName, '0666');

            setTimeout(() => {
              shepherd.log(result);
              shepherd.writeLog(result);
              resolve(result);
            }, 1000);
          });
        }

        const FsWrite = () => {
          return new Promise((resolve, reject) => {
            const result = 'electrumServers.json write file is done';

            fs.writeFile(electrumServersListFileName,
                        JSON.stringify(list)
                        .replace(/,/g, ',\n') // format json in human readable form
                        .replace(/":/g, '": ')
                        .replace(/{/g, '{\n')
                        .replace(/}/g, '\n}'), 'utf8', (err) => {
              if (err)
                return shepherd.log(err);
            });

            fsnode.chmodSync(electrumServersListFileName, '0666');
            setTimeout(() => {
              shepherd.log(result);
              shepherd.log(`electrumServers.json file is created successfully at: ${shepherd.agamaDir}`);
              shepherd.writeLog(`electrumServers.json file is created successfully at: ${shepherd.agamaDir}`);
              resolve(result);
            }, 2000);
          });
        }

        FsWrite()
        .then(FixFilePermissions());
      }
    });
  };

  return shepherd;
};