const fs = require('fs-extra');
const _fs = require('graceful-fs');
const fsnode = require('fs');
const Promise = require('bluebird');
const defaultConf = require('../appConfig.js').config;
const deepmerge = require('./deepmerge.js');

module.exports = (shepherd) => {
  shepherd.loadLocalConfig = () => {
    if (fs.existsSync(`${shepherd.agamaDir}/config.json`)) {
      let localAppConfig = fs.readFileSync(`${shepherd.agamaDir}/config.json`, 'utf8');

      shepherd.log('app config set from local file', 'settings');
      shepherd.writeLog('app config set from local file');

      // find diff between local and hardcoded configs
      // append diff to local config
      const compareJSON = (obj1, obj2) => {
        let result = {};

        for (let i in obj1) {
          if (typeof obj1[i] !== 'object') {
            if (!obj2.hasOwnProperty(i)) {
              result[i] = obj1[i];
            }
          } else {
            for (let j in obj1[i]) {
              if (!obj2[i]) {
                obj2[i] = {};
              }

              if (!obj2[i].hasOwnProperty(j)) {
                if (!result[i]) {
                  result[i] = {};
                }

                shepherd.log(`settings multi-level diff ${i} -> ${j}`, 'settings');
                result[i][j] = obj1[i][j];
              }
            }
          }
        }

        return result;
      };

      if (localAppConfig) {
        // update config to v2.42 compatible
        if (!JSON.parse(localAppConfig).native) {
          let _localAppConfig = JSON.parse(localAppConfig);

          _localAppConfig['native'] = {
            dataDir: defaultConf.native.dataDir,
            cliStopTimeout: defaultConf.native.cliStopTimeout,
            failedRPCAttemptsThreshold: defaultConf.native.failedRPCAttemptsThreshold,
            stopNativeDaemonsOnQuit: defaultConf.native.stopNativeDaemonsOnQuit,
            rpc2cli: defaultConf.native.rpc2cli,
          };

          if (_localAppConfig.hasOwnProperty('dataDir')) {
            _localAppConfig.native.dataDir = _localAppConfig.dataDir;
            delete _localAppConfig.dataDir;
          }
          if (_localAppConfig.hasOwnProperty('cliStopTimeout')) {
            _localAppConfig.native.cliStopTimeout = _localAppConfig.cliStopTimeout;
            delete _localAppConfig.cliStopTimeout;
          }
          if (_localAppConfig.hasOwnProperty('failedRPCAttemptsThreshold')) {
            _localAppConfig.native.failedRPCAttemptsThreshold = _localAppConfig.failedRPCAttemptsThreshold;
            delete _localAppConfig.failedRPCAttemptsThreshold;
          }
          if (_localAppConfig.hasOwnProperty('stopNativeDaemonsOnQuit')) {
            _localAppConfig.native.stopNativeDaemonsOnQuit = _localAppConfig.stopNativeDaemonsOnQuit;
            delete _localAppConfig.stopNativeDaemonsOnQuit;
          }
          if (_localAppConfig.hasOwnProperty('rpc2cli')) {
            _localAppConfig.native.rpc2cli = _localAppConfig.rpc2cli;
            delete _localAppConfig.rpc2cli;
          }

          console.warn('update config to v2.42 compatible', 'settings');
          localAppConfig = JSON.stringify(_localAppConfig);
          shepherd.saveLocalAppConf(_localAppConfig);
        }

        const compareConfigs = compareJSON(defaultConf, JSON.parse(localAppConfig));

        if (Object.keys(compareConfigs).length) {
          const newConfig = deepmerge(defaultConf, JSON.parse(localAppConfig));

          shepherd.log('config diff is found, updating local config', 'settings');
          shepherd.log('config diff:', 'settings');
          shepherd.log(compareConfigs, 'settings');
          shepherd.writeLog('aconfig diff is found, updating local config');
          shepherd.writeLog('config diff:');
          shepherd.writeLog(compareConfigs);

          shepherd.saveLocalAppConf(newConfig);
          return newConfig;
        } else {
          return JSON.parse(localAppConfig);
        }
      } else {
        return shepherd.appConfig;
      }
    } else {
      shepherd.log('local config file is not found!', 'settings');
      shepherd.writeLog('local config file is not found!');
      shepherd.saveLocalAppConf(shepherd.appConfig);

      return shepherd.appConfig;
    }
  };

  shepherd.saveLocalAppConf = (appSettings) => {
    const appConfFileName = `${shepherd.agamaDir}/config.json`;

    _fs.access(shepherd.agamaDir, fs.constants.R_OK, (err) => {
      if (!err) {
        const FixFilePermissions = () => {
          return new Promise((resolve, reject) => {
            const result = 'config.json file permissions updated to Read/Write';

            fsnode.chmodSync(appConfFileName, '0666');

            setTimeout(() => {
              shepherd.log(result, 'settings');
              shepherd.writeLog(result);
              resolve(result);
            }, 1000);
          });
        }

        const FsWrite = () => {
          return new Promise((resolve, reject) => {
            const result = 'config.json write file is done';

            fs.writeFile(appConfFileName,
                        JSON.stringify(appSettings)
                        .replace(/,/g, ',\n') // format json in human readable form
                        .replace(/":/g, '": ')
                        .replace(/{/g, '{\n')
                        .replace(/}/g, '\n}'), 'utf8', (err) => {
              if (err)
                return shepherd.log(err);
            });

            fsnode.chmodSync(appConfFileName, '0666');
            setTimeout(() => {
              shepherd.log(result, 'settings');
              shepherd.log(`app conf.json file is created successfully at: ${shepherd.agamaDir}`, 'settings');
              shepherd.writeLog(`app conf.json file is created successfully at: ${shepherd.agamaDir}`);
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
   *  params: payload
   */
  shepherd.post('/appconf', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      if (!req.body.payload) {
        const errorObj = {
          msg: 'error',
          result: 'no payload provided',
        };

        res.end(JSON.stringify(errorObj));
      } else {
        shepherd.saveLocalAppConf(req.body.payload);

        const successObj = {
          msg: 'success',
          result: 'config saved',
        };

        res.end(JSON.stringify(successObj));
      }
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  /*
   *  type: POST
   *  params: none
   */
  shepherd.post('/appconf/reset', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      shepherd.saveLocalAppConf(shepherd.defaultAppConfig);

      const successObj = {
        msg: 'success',
        result: 'config saved',
      };

      res.end(JSON.stringify(successObj));
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  /*
   *  type: GET
   *
   */
  shepherd.get('/appconf', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      const obj = shepherd.loadLocalConfig();
      res.send(obj);
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  shepherd.testLocation = (path) => {
    return new Promise((resolve, reject) => {
      fs.lstat(path, (err, stats) => {
        if (err) {
          shepherd.log(`error testing path ${path}`, 'settings');
          resolve(-1);
        } else {
          if (stats.isDirectory()) {
            resolve(true);
          } else {
            shepherd.log(`error testing path ${path} not a folder`, 'settings');
            resolve(false);
          }
        }
      });
    });
  }

  return shepherd;
};