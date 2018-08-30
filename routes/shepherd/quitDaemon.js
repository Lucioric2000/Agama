const portscanner = require('portscanner');
const execFile = require('child_process').execFile;

module.exports = (shepherd) => {
  shepherd.quitKomodod = (timeout = 100) => {
    // if komodod is under heavy load it may not respond to cli stop the first time
    // exit komodod gracefully
    let coindExitInterval = {};
    shepherd.lockDownAddCoin = true;

    for (let key in shepherd.coindInstanceRegistry) {
      if (shepherd.appConfig.native.stopNativeDaemonsOnQuit) {
        const chain = key !== 'komodod' ? key : null;
        let _coindQuitCmd = shepherd.komodocliBin;

         // any coind
        if (shepherd.nativeCoindList[key.toLowerCase()]) {
          _coindQuitCmd = `${shepherd.coindRootDir}/${key.toLowerCase()}/${shepherd.nativeCoindList[key.toLowerCase()].bin.toLowerCase()}-cli`;
        }
        if (key === 'CHIPS') {
          _coindQuitCmd = shepherd.chipscliBin;
        }

        const execCliStop = () => {
          let _arg = [];

          if (chain &&
              !shepherd.nativeCoindList[key.toLowerCase()] &&
              key !== 'CHIPS') {
            shepherd.removePubkey(chain.toLowerCase());

            _arg.push(`-ac_name=${chain}`);

            if (shepherd.appConfig.native.dataDir.length) {
              _arg.push(`-datadir=${shepherd.appConfig.native.dataDir + (key !== 'komodod' ? '/' + key : '')}`);
            }
          } else if (
            key === 'komodod' &&
            shepherd.appConfig.native.dataDir.length
          ) {
            _arg.push(`-datadir=${shepherd.appConfig.native.dataDir}`);
          }

          _arg.push('stop');
          execFile(`${_coindQuitCmd}`, _arg, (error, stdout, stderr) => {
            shepherd.log(`stdout: ${stdout}`, 'native.debug');
            shepherd.log(`stderr: ${stderr}`, 'native.debug');
            shepherd.log(`send stop sig to ${key}`, 'native.process');

            if (stdout.indexOf('EOF reached') > -1 ||
                stderr.indexOf('EOF reached') > -1 ||
                (error && error.toString().indexOf('Command failed') > -1 && !stderr) || // windows
                stdout.indexOf('connect to server: unknown (code -1)') > -1 ||
                stderr.indexOf('connect to server: unknown (code -1)') > -1) {
              delete shepherd.coindInstanceRegistry[key];
              clearInterval(coindExitInterval[key]);
            }

            // workaround for AGT-65
            const _port = shepherd.assetChainPorts[key];
            setTimeout(() => {
              portscanner.checkPortStatus(_port, '127.0.0.1', (error, status) => {
                // Status is 'open' if currently in use or 'closed' if available
                if (status === 'closed') {
                  delete shepherd.coindInstanceRegistry[key];
                  clearInterval(coindExitInterval[key]);
                }
              });
            }, 100);

            if (error !== null) {
              shepherd.log(`exec error: ${error}`, 'native.process');
            }

            setTimeout(() => {
              shepherd.killRogueProcess(key === 'CHIPS' ? 'chips-cli' : 'komodo-cli');
            }, 100);
          });
        }

        execCliStop();
        coindExitInterval[key] = setInterval(() => {
          execCliStop();
        }, timeout);
      } else {
        delete shepherd.coindInstanceRegistry[key];
      }
    }
  }

  shepherd.post('/coind/stop', (req, res) => {
    if (shepherd.checkToken(req.body.token)) {
      const _chain = req.body.chain;
      let _coindQuitCmd = shepherd.komodocliBin;
      let _arg = [];


      if (_chain) {
        shepherd.removePubkey(_chain.toLowerCase());

        _arg.push(`-ac_name=${_chain}`);

        if (shepherd.appConfig.native.dataDir.length) {
          _arg.push(`-datadir=${shepherd.appConfig.native.dataDir + (_chain ? '/' + _chain : '')}`);
        }
      } else if (!_chain && shepherd.appConfig.native.dataDir.length) {
        _arg.push(`-datadir=${shepherd.appConfig.native.dataDir}`);
      }

      _arg.push('stop');
      execFile(`${_coindQuitCmd}`, _arg, (error, stdout, stderr) => {
        shepherd.log(`stdout: ${stdout}`, 'native.debug');
        shepherd.log(`stderr: ${stderr}`, 'native.debug');
        shepherd.log(`send stop sig to ${_chain ? _chain : 'komodo'}`, 'native.process');

        if (stdout.indexOf('EOF reached') > -1 ||
            stderr.indexOf('EOF reached') > -1 ||
            (error && error.toString().indexOf('Command failed') > -1 && !stderr) || // win "special snowflake" case
            stdout.indexOf('connect to server: unknown (code -1)') > -1 ||
            stderr.indexOf('connect to server: unknown (code -1)') > -1) {
          delete shepherd.coindInstanceRegistry[_chain ? _chain : 'komodod'];

          const retObj = {
            msg: 'success',
            result: 'result',
          };

          res.end(JSON.stringify(retObj));
        } else {
          if (stdout.indexOf('Komodo server stopping') > -1) {
            delete shepherd.coindInstanceRegistry[_chain ? _chain : 'komodod'];

            const retObj = {
              msg: 'success',
              result: 'result',
            };

            res.end(JSON.stringify(retObj));
          } else {
            const retObj = {
              msg: 'error',
              result: 'result',
            };

            res.end(JSON.stringify(retObj));
          }
        }
      });
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  });

  shepherd.post('/coins/remove', (req, res) => {
    if (shepherd.checkToken(req.body.token)) {
      const _chain = req.body.chain;

      if (req.body.mode === 'native') {
        delete shepherd.coindInstanceRegistry[_chain ? _chain : 'komodod'];

        if (_chain) {
          shepherd.removePubkey(_chain.toLowerCase());
        }

        const retObj = {
          msg: 'success',
          result: 'result',
        };

        res.end(JSON.stringify(retObj));
      } else {
        delete shepherd.electrumCoins[_chain.toLowerCase()];

        if (Object.keys(shepherd.electrumCoins).length - 1 === 0) {
          shepherd.electrumCoins.auth = false;
          shepherd.electrumKeys = {};
        }

        const retObj = {
          msg: 'success',
          result: 'result',
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

  return shepherd;
};
