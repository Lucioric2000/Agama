const bitcoinJS = require('bitcoinjs-lib');
const bitcoinJSForks = require('bitcoinforksjs-lib');
const bitcoinZcash = require('bitcoinjs-lib-zcash');
const bitcoinPos = require('bitcoinjs-lib-pos');
const coinSelect = require('coinselect');

module.exports = (shepherd) => {
  // unsigned tx
  shepherd.buildUnsignedTx = (sendTo, changeAddress, network, utxo, changeValue, spendValue) => {
    let tx;

    // TODO: finish unsigned for zcash, btc forks and pos coins
    if (network === 'btg') {
      tx = new bitcoinJSForks.TransactionBuilder(shepherd.getNetworkData(network));
      tx.enableBitcoinGold(true);
      shepherd.log('enable btg', 'spv.createrawtx');
    } else {
      tx = new bitcoinJS.TransactionBuilder(shepherd.getNetworkData(network));
    }

    shepherd.log('buildSignedTx', 'spv.createrawtx');
    // console.log(`buildSignedTx priv key ${wif}`);
    shepherd.log(`buildSignedTx pub key ${changeAddress}`, 'spv.createrawtx');
    // console.log('buildSignedTx std tx fee ' + shepherd.electrumServers[network].txfee);

    for (let i = 0; i < utxo.length; i++) {
      tx.addInput(utxo[i].txid, utxo[i].vout);
    }

    tx.addOutput(sendTo, Number(spendValue));

    if (changeValue > 0) {
      tx.addOutput(changeAddress, Number(changeValue));
    }

    if (network === 'komodo' ||
        network.toUpperCase() === 'KMD') {
      const _locktime = Math.floor(Date.now() / 1000) - 777;
      tx.setLockTime(_locktime);
      shepherd.log(`kmd tx locktime set to ${_locktime}`, 'spv.createrawtx');
    }

    shepherd.log('buildSignedTx unsigned tx data vin', 'spv.createrawtx');
    shepherd.log(tx.tx.ins, true);
    shepherd.log('buildSignedTx unsigned tx data vout', 'spv.createrawtx');
    shepherd.log(tx.tx.outs, true);
    shepherd.log('buildSignedTx unsigned tx data', 'spv.createrawtx');
    shepherd.log(tx, true);

    const rawtx = tx.buildIncomplete().toHex();

    shepherd.log('buildUnsignedTx tx hex', 'spv.createrawtx');
    shepherd.log(rawtx, 'spv.createrawtx');

    return rawtx;
  }

  // single sig
  shepherd.buildSignedTx = (sendTo, changeAddress, wif, network, utxo, changeValue, spendValue, opreturn) => {
    let key = shepherd.isZcash(network) ? bitcoinZcash.ECPair.fromWIF(wif, shepherd.getNetworkData(network)) : bitcoinJS.ECPair.fromWIF(wif, shepherd.getNetworkData(network));
    let tx;

    if (shepherd.isZcash(network)) {
      tx = new bitcoinZcash.TransactionBuilder(shepherd.getNetworkData(network));
    } else if (shepherd.isPos(network)) {
      tx = new bitcoinPos.TransactionBuilder(shepherd.getNetworkData(network));
    } else {
      tx = new bitcoinJS.TransactionBuilder(shepherd.getNetworkData(network));
    }

    shepherd.log('buildSignedTx', 'spv.createrawtx');
    // console.log(`buildSignedTx priv key ${wif}`);
    shepherd.log(`buildSignedTx pub key ${key.getAddress().toString()}`, 'spv.createrawtx');
    // console.log('buildSignedTx std tx fee ' + shepherd.electrumServers[network].txfee);

    for (let i = 0; i < utxo.length; i++) {
      tx.addInput(utxo[i].txid, utxo[i].vout);
    }

    if (shepherd.isPos(network)) {
      tx.addOutput(
        sendTo,
        Number(spendValue),
        shepherd.getNetworkData(network)
      );
    } else {
      tx.addOutput(sendTo, Number(spendValue));
    }

    if (changeValue > 0) {
      if (shepherd.isPos(network)) {
        tx.addOutput(
          changeAddress,
          Number(changeValue),
          shepherd.getNetworkData(network)
        );
      } else {
        tx.addOutput(changeAddress, Number(changeValue));
      }
    }

    if (opreturn) {
      const data = Buffer.from(opreturn, 'utf8');
      const dataScript = shepherd.bitcoinJS.script.nullData.output.encode(data);
      tx.addOutput(dataScript, 1000);
      shepherd.log(`opreturn ${opreturn}`, 'spv.createrawtx');
    }

    if (network === 'komodo' ||
        network.toUpperCase() === 'KMD') {
      const _locktime = Math.floor(Date.now() / 1000) - 777;
      tx.setLockTime(_locktime);
      shepherd.log(`kmd tx locktime set to ${_locktime}`, 'spv.createrawtx');
    }

    shepherd.log('buildSignedTx unsigned tx data vin', 'spv.createrawtx');
    shepherd.log(tx.tx.ins, 'spv.createrawtx');
    shepherd.log('buildSignedTx unsigned tx data vout', 'spv.createrawtx');
    shepherd.log(tx.tx.outs, 'spv.createrawtx');
    shepherd.log('buildSignedTx unsigned tx data', 'spv.createrawtx');
    shepherd.log(tx, 'spv.createrawtx');

    for (let i = 0; i < utxo.length; i++) {
      if (shepherd.isPos(network)) {
        tx.sign(
          shepherd.getNetworkData(network),
          i,
          key
        );
      } else {
        tx.sign(i, key);
      }
    }

    const rawtx = tx.build().toHex();

    shepherd.log('buildSignedTx signed tx hex', 'spv.createrawtx');
    shepherd.log(rawtx, 'spv.createrawtx');

    return rawtx;
  }

  // btg
  shepherd.buildSignedTxForks = (sendTo, changeAddress, wif, network, utxo, changeValue, spendValue) => {
    let tx;

    if (network === 'btg' ||
        network === 'bch') {
      tx = new bitcoinJSForks.TransactionBuilder(shepherd.getNetworkData(network));
    }

    const keyPair = bitcoinJSForks.ECPair.fromWIF(wif, shepherd.getNetworkData(network));
    const pk = bitcoinJSForks.crypto.hash160(keyPair.getPublicKeyBuffer());
    const spk = bitcoinJSForks.script.pubKeyHash.output.encode(pk);

    shepherd.log(`buildSignedTx${network.toUpperCase()}`, 'spv.createrawtx');

    for (let i = 0; i < utxo.length; i++) {
      tx.addInput(
        utxo[i].txid,
        utxo[i].vout,
        bitcoinJSForks.Transaction.DEFAULT_SEQUENCE,
        spk
      );
    }

    tx.addOutput(sendTo, Number(spendValue));

    if (changeValue > 0) {
      tx.addOutput(changeAddress, Number(changeValue));
    }

    if (network === 'btg') {
      tx.enableBitcoinGold(true);
    } else if (network === 'bch') {
      tx.enableBitcoinCash(true);
    }

    tx.setVersion(2);

    shepherd.log('buildSignedTx unsigned tx data vin', 'spv.createrawtx');
    shepherd.log(tx.tx.ins, 'spv.createrawtx');
    shepherd.log('buildSignedTx unsigned tx data vout', 'spv.createrawtx');
    shepherd.log(tx.tx.outs, 'spv.createrawtx');
    shepherd.log('buildSignedTx unsigned tx data', 'spv.createrawtx');
    shepherd.log(tx, 'spv.createrawtx');

    const hashType = bitcoinJSForks.Transaction.SIGHASH_ALL | bitcoinJSForks.Transaction.SIGHASH_BITCOINCASHBIP143;

    for (let i = 0; i < utxo.length; i++) {
      tx.sign(
        i,
        keyPair,
        null,
        hashType,
        utxo[i].value
      );
    }

    const rawtx = tx.build().toHex();

    shepherd.log('buildSignedTx signed tx hex', 'spv.createrawtx');
    shepherd.log(rawtx, 'spv.createrawtx');

    return rawtx;
  }

  shepherd.maxSpendBalance = (utxoList, fee) => {
    let maxSpendBalance = 0;

    for (let i = 0; i < utxoList.length; i++) {
      maxSpendBalance += Number(utxoList[i].value);
    }

    if (fee) {
      return Number(maxSpendBalance) - Number(fee);
    } else {
      return maxSpendBalance;
    }
  }

  shepherd._listunspent = (grainedControlUtxos, ecl, changeAddress, network, full, verify) => {
    shepherd.log(`verify ${verify}`, 'spv.listunspent');

    return new Promise((resolve, reject) => {
      if (grainedControlUtxos) {
        resolve(grainedControlUtxos);
      } else {
        shepherd.listunspent(
          ecl,
          changeAddress,
          network,
          true,
          verify === true ? true : null
        )
        .then((utxoList) => {
          resolve(utxoList);
        });
      }
    });
  };

  shepherd.get('/electrum/createrawtx', (req, res, next) => {
    shepherd.createTx(req, res, next);
  });

  shepherd.post('/electrum/createrawtx', (req, res, next) => {
    shepherd.createTx(req, res, next, 'body');
  });

  shepherd.createTx = (req, res, next, reqType = 'query') => {
    if (shepherd.checkToken(req[reqType].token)) {
      // TODO: unconf output(s) error message
      const network = req[reqType].network || shepherd.findNetworkObj(req[reqType].coin);
      const ecl = shepherd.ecl(network);
      const outputAddress = req[reqType].address;
      const changeAddress = req[reqType].change;
      const push = req[reqType].push;
      const opreturn = req[reqType].opreturn;
      const btcFee = req[reqType].customFee && Number(req[reqType].customFee) !== 0 ? null : (req[reqType].btcfee ? Number(req[reqType].btcfee) : null);
      let fee = req[reqType].customFee && Number(req[reqType].customFee) !== 0 ? Number(req[reqType].customFee) : shepherd.electrumServers[network].txfee;
      let value = Number(req[reqType].value);
      let wif = req[reqType].wif;

      if (req[reqType].gui) {
        wif = shepherd.electrumKeys[req[reqType].coin.toLowerCase()].priv;
      }

      if (req[reqType].vote) {
        wif = shepherd.elections.priv;
      }

      if (btcFee) {
        fee = 0;
      }

      shepherd.log('electrum createrawtx =>', 'spv.createrawtx');

      ecl.connect();
      shepherd._listunspent(
        req[reqType].utxo ? req[reqType].utxo : false,
        ecl,
        changeAddress,
        network,
        true,
        req[reqType].verify === 'true' || req[reqType].verify === true ? true : null
      )
      .then((utxoList) => {
        ecl.close();

        if (utxoList &&
            utxoList.length &&
            utxoList[0] &&
            utxoList[0].txid) {
          let utxoListFormatted = [];
          let totalInterest = 0;
          let totalInterestUTXOCount = 0;
          let interestClaimThreshold = 200;
          let utxoVerified = true;

          for (let i = 0; i < utxoList.length; i++) {
            if (network === 'komodo' ||
                network.toLowerCase() === 'kmd') {
              utxoListFormatted.push({
                txid: utxoList[i].txid,
                vout: utxoList[i].vout,
                value: Number(utxoList[i].amountSats),
                interestSats: Number(utxoList[i].interestSats),
                verified: utxoList[i].verified ? utxoList[i].verified : false,
              });
            } else {
              utxoListFormatted.push({
                txid: utxoList[i].txid,
                vout: utxoList[i].vout,
                value: Number(utxoList[i].amountSats),
                verified: utxoList[i].verified ? utxoList[i].verified : false,
              });
            }
          }

          shepherd.log('electrum listunspent unformatted ==>', 'spv.createrawtx');
          shepherd.log(utxoList, 'spv.createrawtx');

          shepherd.log('electrum listunspent formatted ==>', 'spv.createrawtx');
          shepherd.log(utxoListFormatted, 'spv.createrawtx');

          const _maxSpendBalance = Number(shepherd.maxSpendBalance(utxoListFormatted));
          let targets = [{
            address: outputAddress,
            value: value > _maxSpendBalance ? _maxSpendBalance : value,
          }];
          shepherd.log('targets =>', 'spv.createrawtx');
          shepherd.log(targets, 'spv.createrawtx');

          targets[0].value = targets[0].value + fee;

          shepherd.log(`default fee ${fee}`, 'spv.createrawtx');
          shepherd.log('targets ==>', 'spv.createrawtx');
          shepherd.log(targets, 'spv.createrawtx');

          // default coin selection algo blackjack with fallback to accumulative
          // make a first run, calc approx tx fee
          // if ins and outs are empty reduce max spend by txfee
          const firstRun = coinSelect(
            utxoListFormatted,
            targets,
            btcFee ? btcFee : 0
          );
          let inputs = firstRun.inputs;
          let outputs = firstRun.outputs;

          if (btcFee) {
            shepherd.log(`btc fee per byte ${btcFee}`, 'spv.createrawtx');
            fee = firstRun.fee;
          }

          shepherd.log('coinselect res =>', 'spv.createrawtx');
          shepherd.log('coinselect inputs =>', 'spv.createrawtx');
          shepherd.log(inputs, 'spv.createrawtx');
          shepherd.log('coinselect outputs =>', 'spv.createrawtx');
          shepherd.log(outputs, 'spv.createrawtx');
          shepherd.log('coinselect calculated fee =>', 'spv.createrawtx');
          shepherd.log(fee, 'spv.createrawtx');

          if (!outputs) {
            targets[0].value = targets[0].value - fee;
            shepherd.log('second run', 'spv.createrawtx');
            shepherd.log('coinselect adjusted targets =>', 'spv.createrawtx');
            shepherd.log(targets, 'spv.createrawtx');

            const secondRun = coinSelect(
              utxoListFormatted,
              targets,
              0
            );
            inputs = secondRun.inputs;
            outputs = secondRun.outputs;
            fee = fee ? fee : secondRun.fee;

            shepherd.log('second run coinselect inputs =>', 'spv.createrawtx');
            shepherd.log(inputs, 'spv.createrawtx');
            shepherd.log('second run coinselect outputs =>', 'spv.createrawtx');
            shepherd.log(outputs, 'spv.createrawtx');
            shepherd.log('second run coinselect fee =>', 'spv.createrawtx');
            shepherd.log(fee, 'spv.createrawtx');
          }

          let _change = 0;

          if (outputs &&
              outputs.length === 2) {
            _change = outputs[1].value - fee;
          }

          if (!btcFee &&
              _change === 0) {
            outputs[0].value = outputs[0].value - fee;
          }

          if (btcFee) {
            value = outputs[0].value;
          } else {
            if (_change > 0) {
              value = outputs[0].value - fee;
            }
          }

          shepherd.log('adjusted outputs, value - default fee =>', 'spv.createrawtx');
          shepherd.log(outputs, 'spv.createrawtx');

          // check if any outputs are unverified
          if (inputs &&
              inputs.length) {
            for (let i = 0; i < inputs.length; i++) {
              if (!inputs[i].verified) {
                utxoVerified = false;
                break;
              }
            }

            for (let i = 0; i < inputs.length; i++) {
              if (Number(inputs[i].interestSats) > interestClaimThreshold) {
                totalInterest += Number(inputs[i].interestSats);
                totalInterestUTXOCount++;
              }
            }
          }

          const _maxSpend = shepherd.maxSpendBalance(utxoListFormatted);

          if (value > _maxSpend) {
            const retsObj = {
              msg: 'error',
              result: `Spend value is too large. Max available amount is ${Number((_maxSpend * 0.00000001.toFixed(8)))}`,
            };

            res.end(JSON.stringify(retObj));
          } else {
            shepherd.log(`maxspend ${_maxSpend} (${_maxSpend * 0.00000001})`, 'spv.createrawtx');
            shepherd.log(`value ${value}`, 'spv.createrawtx');
            shepherd.log(`sendto ${outputAddress} amount ${value} (${value * 0.00000001})`, 'spv.createrawtx');
            shepherd.log(`changeto ${changeAddress} amount ${_change} (${_change * 0.00000001})`, 'spv.createrawtx');

            // account for KMD interest
            if ((network === 'komodo' || network.toLowerCase() === 'kmd') &&
                totalInterest > 0) {
              // account for extra vout
              // const _feeOverhead = outputs.length === 1 ? shepherd.estimateTxSize(0, 1) * feeRate : 0;
              const _feeOverhead = 0;

              shepherd.log(`max interest to claim ${totalInterest} (${totalInterest * 0.00000001})`, 'spv.createrawtx');
              shepherd.log(`estimated fee overhead ${_feeOverhead}`, 'spv.createrawtx');
              shepherd.log(`current change amount ${_change} (${_change * 0.00000001}), boosted change amount ${_change + (totalInterest - _feeOverhead)} (${(_change + (totalInterest - _feeOverhead)) * 0.00000001})`, 'spv.createrawtx');

              if (_maxSpend - fee === value) {
                _change = totalInterest - _change - _feeOverhead;

                if (outputAddress === changeAddress) {
                  value += _change;
                  _change = 0;
                  shepherd.log(`send to self ${outputAddress} = ${changeAddress}`, 'spv.createrawtx');
                  shepherd.log(`send to self old val ${value}, new val ${value + _change}`, 'spv.createrawtx');
                }
              } else {
                _change = _change + (totalInterest - _feeOverhead);
              }
            }

            if (!inputs &&
                !outputs) {
              const retObj = {
                msg: 'error',
                result: 'Can\'t find best fit utxo. Try lower amount.',
              };

              res.end(JSON.stringify(retObj));
            } else {
              let vinSum = 0;

              for (let i = 0; i < inputs.length; i++) {
                vinSum += inputs[i].value;
              }

              const _estimatedFee = vinSum - outputs[0].value - _change;

              shepherd.log(`vin sum ${vinSum} (${vinSum * 0.00000001})`, 'spv.createrawtx');
              shepherd.log(`estimatedFee ${_estimatedFee} (${_estimatedFee * 0.00000001})`, 'spv.createrawtx');
              // double check no extra fee is applied
              shepherd.log(`vin - vout ${vinSum - value - _change}`, 'spv.createrawtx');

              if ((vinSum - value - _change) > fee) {
                _change += fee;
                shepherd.log(`double fee, increase change by ${fee}`, 'spv.createrawtx');
              } else if ((vinSum - value - _change) === 0) { // max amount spend edge case
                shepherd.log(`zero fee, reduce output size by ${fee}`, 'spv.createrawtx');
                value = value - fee;
              }

              // TODO: use individual dust thresholds
              if (_change > 0 &&
                  _change <= 1000) {
                shepherd.log(`change is < 1000 sats, donate ${_change} sats to miners`, 'spv.createrawtx');
                _change = 0;
              }

              let _rawtx;

              if (req[reqType].nosig) {
                const _rawObj = {
                  utxoSet: inputs,
                  change: _change,
                  changeAdjusted: _change,
                  totalInterest,
                  fee,
                  value,
                  outputAddress,
                  changeAddress,
                  network,
                  utxoVerified,
                };

                const retObj = {
                  msg: 'success',
                  result: _rawObj,
                };

                res.end(JSON.stringify(retObj));
              } else {
                if (req[reqType].unsigned) {
                  _rawtx = shepherd.buildUnsignedTx(
                    outputAddress,
                    changeAddress,
                    network,
                    inputs,
                    _change,
                    value
                  );
                } else {
                  if (!req[reqType].offline) {
                    if (network === 'btg' ||
                        network === 'bch') {
                      _rawtx = shepherd.buildSignedTxForks(
                        outputAddress,
                        changeAddress,
                        wif,
                        network,
                        inputs,
                        _change,
                        value
                      );
                    } else {
                      _rawtx = shepherd.buildSignedTx(
                        outputAddress,
                        changeAddress,
                        wif,
                        network,
                        inputs,
                        _change,
                        value,
                        opreturn
                      );
                    }
                  }
                }

                if (!push ||
                    push === 'false') {
                  const retObj = {
                    msg: 'success',
                    result: {
                      utxoSet: inputs,
                      change: _change,
                      changeAdjusted: _change,
                      totalInterest,
                      // wif,
                      fee,
                      value,
                      outputAddress,
                      changeAddress,
                      network,
                      rawtx: _rawtx,
                      utxoVerified,
                    },
                  };

                  res.end(JSON.stringify(retObj));
                } else {
                  const ecl = shepherd.ecl(network);

                  ecl.connect();
                  ecl.blockchainTransactionBroadcast(_rawtx)
                  .then((txid) => {
                    ecl.close();

                    let _rawObj = {
                      utxoSet: inputs,
                      change: _change,
                      changeAdjusted: _change,
                      totalInterest,
                      fee,
                      value,
                      outputAddress,
                      changeAddress,
                      network,
                      rawtx: _rawtx,
                      txid,
                      utxoVerified,
                    };

                    if (txid &&
                        JSON.stringify(txid).indexOf('fee not met') > -1) {
                      _rawObj.txid = JSON.stringify(_rawObj.txid);

                      const retObj = {
                        msg: 'error',
                        result: 'Missing fee',
                        raw: _rawObj,
                      };

                      res.end(JSON.stringify(retObj));
                    } else if (
                      txid &&
                      txid.indexOf('bad-txns-inputs-spent') > -1
                    ) {
                      const retObj = {
                        msg: 'error',
                        result: 'Bad transaction inputs spent',
                        raw: _rawObj,
                      };

                      res.end(JSON.stringify(retObj));
                    } else if (
                      txid &&
                      txid.length === 64
                    ) {
                      if (txid.indexOf('bad-txns-in-belowout') > -1) {
                        const retObj = {
                          msg: 'error',
                          result: 'Bad transaction inputs spent',
                          raw: _rawObj,
                        };

                        res.end(JSON.stringify(retObj));
                      } else {
                        const retObj = {
                          msg: 'success',
                          result: _rawObj,
                        };

                        res.end(JSON.stringify(retObj));
                      }
                    } else if (
                      txid &&
                      txid.indexOf('bad-txns-in-belowout') > -1
                    ) {
                      const retObj = {
                        msg: 'error',
                        result: 'Bad transaction inputs spent',
                        raw: _rawObj,
                      };

                      res.end(JSON.stringify(retObj));
                    } else {
                      const retObj = {
                        msg: 'error',
                        result: 'Can\'t broadcast transaction',
                        raw: _rawObj,
                      };

                      res.end(JSON.stringify(retObj));
                    }
                  });
                }
              }
            }
          }
        } else {
          const retObj = {
            msg: 'error',
            result: utxoList,
          };

          res.end(JSON.stringify(retObj));
        }
      });
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(retObj));
    }
  };

  shepherd.post('/electrum/pushtx', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      const rawtx = req.body.rawtx;
      const _network = req.body.network;
      const ecl = shepherd.ecl(_network);

      ecl.connect();
      ecl.blockchainTransactionBroadcast(rawtx)
      .then((json) => {
        ecl.close();
        shepherd.log('electrum pushtx ==>', 'spv.pushtx');
        shepherd.log(json, 'spv.pushtx');

        const retObj = {
          msg: 'success',
          result: json,
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

  return shepherd;
};