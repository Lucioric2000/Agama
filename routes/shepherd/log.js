const fs = require('fs-extra');
const Promise = require('bluebird');

module.exports = (shepherd) => {
  shepherd.log = (msg, type) => {
    if (shepherd.appConfig.dev ||
        shepherd.appConfig.debug) {
      console.log(msg);
    }

    shepherd.appRuntimeLog.push({
      time: Date.now(),
      msg: msg,
      type: type,
    });
  }

  shepherd.writeLog = (data) => {
    const logLocation = `${shepherd.agamaDir}/shepherd`;
    const timeFormatted = new Date(Date.now()).toLocaleString('en-US', { hour12: false });

    if (shepherd.appConfig.debug) {
      if (fs.existsSync(`${logLocation}/agamalog.txt`)) {
        fs.appendFile(`${logLocation}/agamalog.txt`, `${timeFormatted}  ${data}\r\n`, (err) => {
          if (err) {
            shepherd.log('error writing log file');
          }
        });
      } else {
        fs.writeFile(`${logLocation}/agamalog.txt`, `${timeFormatted}  ${data}\r\n`, (err) => {
          if (err) {
            shepherd.log('error writing log file');
          }
        });
      }
    }
  }

  shepherd.get('/log/runtime', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      let _res = JSON.parse(JSON.stringify(shepherd.appRuntimeLog));
      let _searchTerm = req.query.term;
      let _logType = req.query.type;

      if (_logType) {
        _res = _res.filter(req.query.typeExact ? item => item.type === _logType : item => item.type.indexOf(_logType) > -1);
      }

      if (_searchTerm) {
        let _searchRes = [];

        for (let i = 0; i < _res.length; i++) {
          if (JSON.stringify(_res[i].msg).indexOf(_searchTerm) > -1) {
            _searchRes.push(_res[i]);
          }
        }

        if (_searchRes.length) {
          const retObj = {
            msg: 'success',
            result: _searchRes,
          };

          res.end(JSON.stringify(retObj));
        } else {
          const retObj = {
            msg: 'success',
            result: 'can\'t find any matching for ' + _searchTerm,
          };

          res.end(JSON.stringify(retObj));
        }
      } else {
        const retObj = {
          msg: 'success',
          result: _res,
        };

        res.end(JSON.stringify(retObj));
      }
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  shepherd.getAppRuntimeLog = () => {
    return new Promise((resolve, reject) => {
      resolve(shepherd.appRuntimeLog);
    });
  };

  /*  needs a fix
   *  type: POST
   *  params: payload
   */
  shepherd.post('/guilog', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      const logLocation = `${shepherd.agamaDir}/shepherd`;
      const timestamp = req.body.timestamp;

      if (!shepherd.guiLog[shepherd.appSessionHash]) {
        shepherd.guiLog[shepherd.appSessionHash] = {};
      }

      if (shepherd.guiLog[shepherd.appSessionHash][timestamp]) {
        shepherd.guiLog[shepherd.appSessionHash][timestamp].status = req.body.status;
        shepherd.guiLog[shepherd.appSessionHash][timestamp].response = req.body.response;
      } else {
        shepherd.guiLog[shepherd.appSessionHash][timestamp] = {
          function: req.body.function,
          type: req.body.type,
          url: req.body.url,
          payload: req.body.payload,
          status: req.body.status,
        };
      }

      fs.writeFile(`${logLocation}/agamalog.json`, JSON.stringify(shepherd.guiLog), (err) => {
        if (err) {
          shepherd.writeLog('error writing gui log file');
        }

        const retObj = {
          msg: 'success',
          result: 'gui log entry is added',
        };

        res.end(JSON.stringify(retObj));
      });
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  /*
   *  type: GET
   *  params: type
   */
  shepherd.get('/getlog', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      const logExt = req.query.type === 'txt' ? 'txt' : 'json';

      if (fs.existsSync(`${shepherd.agamaDir}/shepherd/agamalog.${logExt}`)) {
        fs.readFile(`${shepherd.agamaDir}/shepherd/agamalog.${logExt}`, 'utf8', (err, data) => {
          if (err) {
            const retObj = {
              msg: 'error',
              result: err,
            };

            res.end(JSON.stringify(retObj));
          } else {
            const retObj = {
              msg: 'success',
              result: data ? JSON.parse(data) : '',
            };

            res.end(JSON.stringify(retObj));
          }
        });
      } else {
        const retObj = {
          msg: 'error',
          result: `agama.${logExt} doesnt exist`,
        };

        res.end(JSON.stringify(retObj));
      }
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  shepherd.printDirs = () => {
    shepherd.log(`agama dir: ${shepherd.agamaDir}`, 'env');
    shepherd.log('--------------------------', 'env')
    shepherd.log(`komodo dir: ${shepherd.komododBin}`, 'env');
    shepherd.log(`komodo bin: ${shepherd.komodoDir}`, 'env');
    shepherd.writeLog(`agama dir: ${shepherd.agamaDir}`);
    shepherd.writeLog(`komodo dir: ${shepherd.komododBin}`);
    shepherd.writeLog(`komodo bin: ${shepherd.komodoDir}`);
  }

  return shepherd;
};