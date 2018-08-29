const fs = require('fs-extra');
const _fs = require('graceful-fs');
const fsnode = require('fs');
const Promise = require('bluebird');

module.exports = (shepherd) => {
  shepherd.loadLocalSPVCache = () => {
    if (fs.existsSync(`${shepherd.agamaDir}/spv-cache.json`)) {
      let localCache = fs.readFileSync(`${shepherd.agamaDir}/spv-cache.json`, 'utf8');

      shepherd.log('local spv cache loaded from local file', 'spv.cache');

      try {
        shepherd.electrumCache = JSON.parse(localCache);
      } catch (e) {
        shepherd.log('local spv cache file is damaged, create new', 'spv.cache');
        shepherd.saveLocalSPVCache();
        shepherd.electrumCache = {};
      }
    } else {
      shepherd.log('local spv cache file is not found, create new', 'spv.cache');
      shepherd.saveLocalSPVCache();
      shepherd.electrumCache = {};
    }
  };

  shepherd.saveLocalSPVCache = () => {
    let spvCacheFileName = `${shepherd.agamaDir}/spv-cache.json`;

    _fs.access(shepherd.agamaDir, fs.constants.R_OK, (err) => {
      if (!err) {
        const FixFilePermissions = () => {
          return new Promise((resolve, reject) => {
            const result = 'spv-cache.json file permissions updated to Read/Write';

            fsnode.chmodSync(spvCacheFileName, '0666');

            setTimeout(() => {
              shepherd.log(result, 'spv.cache');
              shepherd.writeLog(result);
              resolve(result);
            }, 1000);
          });
        }

        const FsWrite = () => {
          return new Promise((resolve, reject) => {
            const result = 'spv-cache.json write file is done';

            const err = fs.writeFileSync(spvCacheFileName,
                        JSON.stringify(shepherd.electrumCache)
                        /*.replace(/,/g, ',\n') // format json in human readable form
                        .replace(/":/g, '": ')
                        .replace(/{/g, '{\n')
                        .replace(/}/g, '\n}')*/, 'utf8');

            if (err)
              return shepherd.log(err, 'spv.cache');

            fsnode.chmodSync(spvCacheFileName, '0666');
            setTimeout(() => {
              shepherd.log(result, 'spv.cache');
              shepherd.log(`spv-cache.json file is created successfully at: ${shepherd.agamaDir}`, 'spv.cache');
              resolve(result);
            }, 2000);
          });
        }

        FsWrite()
        .then(FixFilePermissions());
      }
    });
  }

  /*
   *  type: POST
   *
   */
  shepherd.post('/electrum/cache/delete', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      shepherd.electrumCache = {};
      shepherd.saveLocalSPVCache();

      const returnObj = {
        msg: 'success',
        result: 'spv cache is removed',
      };

      res.end(JSON.stringify(returnObj));
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  shepherd.getTransaction = (txid, network, ecl) => {
    return new Promise((resolve, reject) => {
      if (!shepherd.electrumCache[network]) {
        shepherd.electrumCache[network] = {};
      }
      if (!shepherd.electrumCache[network].tx) {
        shepherd.electrumCache[network].tx = {};
      }

      if (!shepherd.electrumCache[network].tx[txid]) {
        shepherd.log(`electrum raw input tx ${txid}`, 'spv.cache');

        ecl.blockchainTransactionGet(txid)
        .then((_rawtxJSON) => {
          shepherd.electrumCache[network].tx[txid] = _rawtxJSON;
          resolve(_rawtxJSON);
        });
      } else {
        shepherd.log(`electrum cached raw input tx ${txid}`, 'spv.cached');
        resolve(shepherd.electrumCache[network].tx[txid]);
      }
    });
  }

  shepherd.getTransactionDecoded = (txid, network, data) => {
    if (!shepherd.electrumCache[network].txDecoded) {
      shepherd.electrumCache[network].txDecoded = {};
    }

    if (shepherd.electrumCache[network].txDecoded[txid]) {
      shepherd.log(`electrum raw input tx decoded ${txid}`, 'spv.cache');
      return shepherd.electrumCache[network].txDecoded[txid];
    } else {
      if (data) {
        shepherd.electrumCache[network].txDecoded[txid] = data;
      } else {
        return false;
      }
    }
  }

  shepherd.getBlockHeader = (height, network, ecl) => {
    return new Promise((resolve, reject) => {
      if (!shepherd.electrumCache[network]) {
        shepherd.electrumCache[network] = {};
      }
      if (!shepherd.electrumCache[network].blockHeader) {
        shepherd.electrumCache[network].blockHeader = {};
      }

      if (!shepherd.electrumCache[network].blockHeader[height]) {
        shepherd.log(`electrum raw block ${height}`, 'spv.cache');

        ecl.blockchainBlockGetHeader(height)
        .then((_rawtxJSON) => {
          shepherd.electrumCache[network].blockHeader[height] = _rawtxJSON;
          resolve(_rawtxJSON);
        });
      } else {
        shepherd.log(`electrum cached raw block ${height}`, 'spv.cache');
        resolve(shepherd.electrumCache[network].blockHeader[height]);
      }
    });
  }

  return shepherd;
};