// ref: https://github.com/VerusCoin/Agama/blob/master/routes/shepherd/downloadZcparams.js

const fs = require('fs-extra');
const _fs = require('graceful-fs');
const Promise = require('bluebird');

module.exports = (api) => {
  api.zcashParamsDownloadLinks = {
    'z.cash': {
      proving: 'https://z.cash/downloads/sprout-proving.key',
      verifying: 'https://z.cash/downloads/sprout-verifying.key',
      spend: 'https://z.cash/downloads/sapling-spend.params',
      output: 'https://z.cash/downloads/sapling-output.params',
      groth16: 'https://z.cash/downloads/sprout-groth16.params',
    },
    'veruscoin.io': {
      proving: 'https://veruscoin.io/zcparams/sprout-proving.key',
      verifying: 'https://veruscoin.io/zcparams/sprout-verifying.key',
      spend: 'https://veruscoin.io/zcparams/sapling-spend.params',
      output: 'https://veruscoin.io/zcparams/sapling-output.params',
      groth16: 'https://veruscoin.io/zcparams/sprout-groth16.params',
    },
  };

  api.zcashParamsExist = () => {
    let _checkList = {
      rootDir: _fs.existsSync(api.zcashParamsDir),
      provingKey: _fs.existsSync(`${api.zcashParamsDir}/sprout-proving.key`),
      provingKeySize: false,
      verifyingKey: _fs.existsSync(`${api.zcashParamsDir}/sprout-verifying.key`),
      verifyingKeySize: false,
      spend: _fs.existsSync(`${api.zcashParamsDir}/sapling-spend.params`),
      output: _fs.existsSync(`${api.zcashParamsDir}/sapling-output.params`),
      groth16: _fs.existsSync(`${api.zcashParamsDir}/sprout-groth16.params`),
      errors: false,
    };

    if (_checkList.rootDir &&
        _checkList.provingKey &&
        _checkList.verifyingKey &&
        _checkList.spend &&
        _checkList.output &&
        _checkList.groth16) {
      // verify each key size
      const _provingKeySize = _checkList.provingKey ? fs.lstatSync(`${api.zcashParamsDir}/sprout-proving.key`) : 0;
      const _verifyingKeySize = _checkList.verifyingKey ? fs.lstatSync(`${api.zcashParamsDir}/sprout-verifying.key`) : 0;

      if (Number(_provingKeySize.size) === 910173851) { // bytes
        _checkList.provingKeySize = true;
      }
      if (Number(_verifyingKeySize.size) === 1449) {
        _checkList.verifyingKeySize = true;
      }

      api.log('zcashparams exist');
    } else {
      api.log('zcashparams doesnt exist');
    }

    if (!_checkList.rootDir ||
        !_checkList.provingKey ||
        !_checkList.verifyingKey ||
        !_checkList.provingKeySize ||
        !_checkList.verifyingKeySize ||
        !_checkList.spend ||
        !_checkList.output ||
        !_checkList.groth16) {
      _checkList.errors = true;
    }

    return _checkList;
  }

  api.zcashParamsExistPromise = () => {
    return new Promise((resolve, reject) => {
      const _verify = api.zcashParamsExist();
      resolve(_verify);
    });
  };

  /*
   *  Update bins
   *  type:
   *  params:
   */
  api.get('/zcparamsdl', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      // const dlLocation = api.zcashParamsDir + '/test';
      const dlLocation = api.zcashParamsDir;
      const dlOption = req.query.dloption;

      const successObj = {
        msg: 'success',
        result: 'zcash params dl started',
      };

      res.end(JSON.stringify(successObj));

      for (let key in api.zcashParamsDownloadLinks[dlOption]) {
        api.downloadFile({
          remoteFile: api.zcashParamsDownloadLinks[dlOption][key],
          localFile: key === 'spend' || key === 'output' ? 
          `${dlLocation}/sapling-${key}.params` : 
          (key === 'groth16' ? `${dlLocation}/sprout-${key}.params` : `${dlLocation}/sprout-${key}.key`),
          onProgress: (received, total) => {
            const percentage = (received * 100) / total;

            if (percentage.toString().indexOf('.10') > -1) {
              api.io.emit('zcparams', {
                msg: {
                  type: 'zcpdownload',
                  status: 'progress',
                  file: key,
                  bytesTotal: total,
                  bytesReceived: received,
                  progress: percentage,
                },
              });
              // api.log(`${key} ${percentage}% | ${received} bytes out of ${total} bytes.`);
            }
          }
        })
        .then(() => {
          const checkZcashParams = api.zcashParamsExist();

          api.log(`${key} dl done`);

          if (checkZcashParams.error) {
            api.io.emit('zcparams', {
              msg: {
                type: 'zcpdownload',
                file: key,
                status: 'error',
                message: 'size mismatch',
                progress: 100,
              },
            });
          } else {
            api.io.emit('zcparams', {
              msg: {
                type: 'zcpdownload',
                file: key,
                progress: 100,
                status: 'done',
              },
            });
            api.log(`file ${key} succesfully downloaded`);
          }
        });
      }
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  return api;
};