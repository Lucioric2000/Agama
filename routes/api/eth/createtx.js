const ethers = require('ethers');
const Promise = require('bluebird');
const request = require('request');
const fees = require('agama-wallet-lib/src/fees');
const { maxSpend } = require('agama-wallet-lib/src/eth');

// TODO: error handling, input vars check

// speed: slow, average, fast
module.exports = (api) => {  
  api.get('/eth/createtx', (req, res, next) => {
    const coin = req.query.coin ? req.query.coin.toUpperCase() : null;
    const push = req.query.push && (req.query.push === true || req.query.push === 'true') ? req.query.push : false;
    const gasLimit = req.query.gaslimit || fees[coin.toLowerCase()];
    const getGas = req.query.getgas ? req.query.getgas : false;
    const speed = req.query.speed ? req.query.speed : 'average';
    const dest = req.query.dest ? req.query.dest : null;
    const network = req.query.network ? req.query.network : 'homestead';
    const amount = req.query.amount ? req.query.amount : 0;
    let gasPrice = !getGas ? api.eth.gasPrice : null;
    let adjustedAmount = 0;

    api.eth._balanceEtherscan(
      api.eth.wallet.signingKey.address,
      network
    )
    .then((maxBalance) => {
      const _createtx = () => {
        const fee = ethers.utils.formatEther(Number(gasPrice[speed]) * Number(gasLimit));
        const _adjustedAmount = maxSpend(maxBalance.balance, fee, amount);
        const _adjustedAmountWei = Number(ethers.utils.parseEther(Number(_adjustedAmount).toPrecision(8)).toString());
  
        if (!push) {
          const data = {
            coin,
            network,
            address: api.eth.wallet.signingKey.address,
            dest, 
            push,
            gasLimit,
            gasPrice,
            gasPriceUsed: gasPrice[speed],
            speed,
            fee,
            feeWei: Number(gasPrice[speed]) * Number(gasLimit),
            amount,
            amountWei: ethers.utils.parseEther(Number(amount).toPrecision(8)).toString(),
            adjustedAmount: _adjustedAmount,
            adjustedAmountWei: _adjustedAmountWei,
            maxBalance,
            //connect: api.eth.connect,
          };

          api.log('tx data', 'eth.createtx');
          api.log(data, 'eth.createtx');
          
          const retObj = {
            msg: 'success',
            result: data,
          };

          res.end(JSON.stringify(retObj));
        } else {
          api.eth.connect[coin].sendTransaction({
            to: dest,
            value: _adjustedAmountWei,
            gasPrice: Number(gasPrice[speed]),
            gasLimit,
          })
          .then((tx) => {
            api.log('eth tx pushed', 'eth.createtx');
            api.log(tx, 'eth.createtx');

            tx.txid = tx.hash;
            
            const retObj = {
              msg: 'success',
              result: tx,
            };

            res.end(JSON.stringify(retObj));
          }, (error) => {
            const retObj = {
              msg: 'error',
              result: tx,
            };

            res.end(JSON.stringify(retObj));
          });
        }
      };

      if (getGas) {
        api.log('request gasprice', 'eth.createtx');
        api._getGasPrice()
        .then((_gasPrice) => {
          api.log('received gasprice', 'eth.createtx');
          api.log(_gasPrice, 'eth.createtx');
          gasPrice = _gasPrice;

          _createtx();
        });
      } else {
        _createtx();
      }
    });
  });

  return api;
};