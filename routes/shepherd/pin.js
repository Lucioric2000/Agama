const fs = require('fs-extra');
const aes256 = require('nodejs-aes256');
const passwdStrength = require('passwd-strength');
const bitcoin = require('bitcoinjs-lib');
const sha256 = require('js-sha256');
const bigi = require('bigi');

module.exports = (shepherd) => {
  /*
   *  type: POST
   *  params: none
   */
  shepherd.post('/encryptkey', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      if (req.body.key &&
          req.body.string) {
        const _pin = req.body.key;
        const hash = sha256.create().update(req.body.string);
        let bytes = hash.array();
        bytes[0] &= 248;
        bytes[31] &= 127;
        bytes[31] |= 64;

        const d = bigi.fromBuffer(bytes);
        const keyPair = new bitcoin.ECPair(d, null, { network: shepherd.getNetworkData('btc') });
        const keys = {
          pub: keyPair.getAddress(),
          priv: keyPair.toWIF(),
        };
        const pubkey = keyPair.getAddress();

        if (passwdStrength(_pin) < 29) {
          shepherd.log('seed storage weak pin!');

          const returnObj = {
            msg: 'error',
            result: false,
          };

          res.end(JSON.stringify(returnObj));
        } else {
          const encryptedString = aes256.encrypt(req.body.key, req.body.string);

          fs.writeFile(`${shepherd.agamaDir}/shepherd/pin/${pubkey}.pin`, encryptedString, (err) => {
            if (err) {
              shepherd.log('error writing pin file');
            }

            const returnObj = {
              msg: 'success',
              result: pubkey,
            };

            res.end(JSON.stringify(returnObj));
          });
        }
      } else {
        const _paramsList = [
          'key',
          'string'
        ];
        let errorObj = {
          msg: 'error',
          result: '',
        };
        let _errorParamsList = [];

        for (let i = 0; i < _paramsList.length; i++) {
          if (!req.query[_paramsList[i]]) {
            _errorParamsList.push(_paramsList[i]);
          }
        }

        errorObj.result = `missing param ${_errorParamsList.join(', ')}`;
        res.end(JSON.stringify(errorObj));
      }
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  shepherd.post('/decryptkey', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      if (req.body.key &&
          req.body.pubkey) {
        if (fs.existsSync(`${shepherd.agamaDir}/shepherd/pin/${req.body.pubkey}.pin`)) {
          fs.readFile(`${shepherd.agamaDir}/shepherd/pin/${req.body.pubkey}.pin`, 'utf8', (err, data) => {
            if (err) {
              const errorObj = {
                msg: 'error',
                result: err,
              };

              res.end(JSON.stringify(errorObj));
            } else {
              const encryptedKey = aes256.decrypt(req.body.key, data);
              // test if stored encrypted passphrase is decrypted correctly
              // if not then the key is wrong
              const _regexTest = encryptedKey.match(/^[0-9a-zA-Z ]+$/g);
              let returnObj;

              if (!_regexTest) {
                returnObj = {
                  msg: 'error',
                  result: 'wrong key',
                };
              } else {
                returnObj = {
                  msg: 'success',
                  result: encryptedKey,
                };
              }

              res.end(JSON.stringify(returnObj));
            }
          });
        } else {
          const errorObj = {
            msg: 'error',
            result: `file ${req.query.pubkey}.pin doesnt exist`,
          };

          res.end(JSON.stringify(errorObj));
        }
      } else {
        const errorObj = {
          msg: 'error',
          result: 'missing key or pubkey param',
        };

        res.end(JSON.stringify(errorObj));
      }
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  shepherd.get('/getpinlist', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      if (fs.existsSync(`${shepherd.agamaDir}/shepherd/pin`)) {
        fs.readdir(`${shepherd.agamaDir}/shepherd/pin`, (err, items) => {
          let _pins = [];

          for (let i = 0; i < items.length; i++) {
            if (items[i].substr(items[i].length - 4, 4) === '.pin') {
              _pins.push(items[i].substr(0, items[i].length - 4));
            }
          }

          if (!items.length) {
            const errorObj = {
              msg: 'error',
              result: 'no pins',
            };

            res.end(JSON.stringify(errorObj));
          } else {
            const successObj = {
              msg: 'success',
              result: _pins,
            };

            res.end(JSON.stringify(successObj));
          }
        });
      } else {
        const errorObj = {
          msg: 'error',
          result: 'pin folder doesnt exist',
        };

        res.end(JSON.stringify(errorObj));
      }
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