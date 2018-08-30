const bitcoinJS = require('bitcoinjs-lib');
const bitcoinJSForks = require('bitcoinforksjs-lib');
const bitcoinZcash = require('bitcoinjs-lib-zcash');
const bitcoinPos = require('bitcoinjs-lib-pos');

module.exports = (shepherd) => {
  // utxo split 1 -> 1, multiple outputs
  shepherd.post('/electrum/createrawtx-split', (req, res, next) => {
    if (shepherd.checkToken(req.body.token)) {
      const wif = req.body.payload.wif;
      const utxo = req.body.payload.utxo;
      const targets = req.body.payload.targets;
      const network = req.body.payload.network;
      const change = req.body.payload.change;
      const outputAddress = req.body.payload.outputAddress;
      const changeAddress = req.body.payload.changeAddress;

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
      shepherd.log(`buildSignedTx pub key ${key.getAddress().toString()}`, 'spv.createrawtx');

      for (let i = 0; i < utxo.length; i++) {
        tx.addInput(utxo[i].txid, utxo[i].vout);
      }

      for (let i = 0; i < targets.length; i++) {
        if (shepherd.isPos(network)) {
          tx.addOutput(
            outputAddress,
            Number(targets[i]),
            shepherd.getNetworkData(network)
          );
        } else {
          tx.addOutput(outputAddress, Number(targets[i]));
        }
      }

      if (Number(change) > 0) {
        if (shepherd.isPos(network)) {
          tx.addOutput(
            changeAddress,
            Number(change),
            shepherd.getNetworkData(network)
          );
        } else {
          shepherd.log(`change ${change}`, 'spv.createrawtx');
          tx.addOutput(changeAddress, Number(change));
        }
      }

      if (network === 'komodo' ||
          network === 'KMD') {
        const _locktime = Math.floor(Date.now() / 1000) - 777;
        tx.setLockTime(_locktime);
        shepherd.log(`kmd tx locktime set to ${_locktime}`, 'spv.createrawtx');
      }

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

      const retObj = {
        msg: 'success',
        result: rawtx,
      };

      res.end(JSON.stringify(retObj));
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