const fs = require('fs-extra');
const _fs = require('graceful-fs');
const fsnode = require('fs');
const Promise = require('bluebird');

const _ticker = {
  litecoin: 'ltc',
  bitcoin: 'btc',
  argentum: 'arg',
  komodo: 'kmd',
  monacoin: 'mona',
  crown: 'crw',
  faircoin: 'fair',
  namecoin: 'nmc',
  vertcoin: 'vtc',
  viacoin: 'via',
  dogecoin: 'doge',
};

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

  shepherd.saveKvElectrumServersCache = (list) => {
    const kvElectrumServersListFileName = `${shepherd.agamaDir}/kvElectrumServersCache.json`;

    _fs.access(shepherd.agamaDir, shepherd.fs.constants.R_OK, (err) => {
      if (!err) {
        const FixFilePermissions = () => {
          return new Promise((resolve, reject) => {
            const result = 'kvElectrumServersCache.json file permissions updated to Read/Write';

            fsnode.chmodSync(kvElectrumServersListFileName, '0666');

            setTimeout(() => {
              shepherd.log(result);
              shepherd.writeLog(result);
              resolve(result);
            }, 1000);
          });
        }

        const FsWrite = () => {
          return new Promise((resolve, reject) => {
            const result = 'kvElectrumServersCache.json write file is done';

            fs.writeFile(kvElectrumServersListFileName,
                        JSON.stringify(list)
                        .replace(/,/g, ',\n') // format json in human readable form
                        .replace(/":/g, '": ')
                        .replace(/{/g, '{\n')
                        .replace(/}/g, '\n}'), 'utf8', (err) => {
              if (err)
                return shepherd.log(err);
            });

            fsnode.chmodSync(kvElectrumServersListFileName, '0666');
            setTimeout(() => {
              shepherd.log(result);
              shepherd.log(`kvElectrumServersCache.json file is created successfully at: ${shepherd.agamaDir}`);
              shepherd.writeLog(`kvElectrumServersCache.json file is created successfully at: ${shepherd.agamaDir}`);
              resolve(result);
            }, 2000);
          });
        }

        FsWrite()
        .then(FixFilePermissions());
      }
    });
  };

  shepherd.get('/electrum/kv/electrum/servers', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      shepherd.listtransactions({
        network: 'KV',
        coin: 'KV',
        address: 'RYTyftx9JEmzaXqQzpBBjJsHe9ZwLpzwCj',
        kv: true,
        maxlength: 100,
        full: true,
      })
      .then((txhistory) => {
        let _kvElectrum = {};

        for (let i = 0; i < txhistory.result.length; i++) {
          try {
            const _kvElectrumItem = JSON.parse(txhistory.result[i].opreturn.kvDecoded.content.body);
            _kvElectrum = Object.assign(_kvElectrum, _kvElectrumItem);
          } catch (e) {}
        }

        shepherd.log(`kv electrum servers, got ${Object.keys(_kvElectrum).length} records`);

        for (let key in _ticker) {
          _kvElectrum[_ticker[key]] = _kvElectrum[key];
        }

        if (req.query.save) {
          shepherd.saveKvElectrumServersCache(_kvElectrum);
        }

        res.end(JSON.stringify({
          msg: 'success',
          result: _kvElectrum,
        }));
      });
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  return shepherd;
};