const ethers = require('ethers');
const Promise = require('bluebird');
const request = require('request');
const fees = require('agama-wallet-lib/src/fees');

// TODO: error handling, input vars check

// speed: slow, average, fast
module.exports = (api) => {  
  api.get('/eth/createtx', (req, res, next) => {
    const coin = req.query.coin ? req.query.coin.toUpperCase() : null;
    const push = req.query.push ? req.query.push : false;
    const gasLimit = req.query.gaslimit || fees[coin];
    const getGas = req.query.getgas ? req.query.getgas : false;
    const speed = req.query.speed ? req.query.speed : 'average';
    const dest = req.query.dest ? req.query.dest : null;
    const network = req.query.network ? req.query.network : null;
    const amount = req.query.amount ? req.query.amount : 0;
    let gasPrice = !getGas ? api.eth.gasPrice : null;
    let adjustedAmount = 0;

    api.eth._balanceEtherscan(
      api.eth.wallet.signingKey.address,
      network
    )
    .then((maxBalance) => {
      const calcAdjustedAmount = (fee) => {
        const _amount = amount > maxBalance.balance ? maxBalance.balance : amount;

        if (Number(_amount) + fee > maxBalance.balance) {
          adjustedAmount = _amount - fee;
        } else {
          adjustedAmount = _amount;
        }

        return adjustedAmount;
      }

      const _createtx = () => {
        const fee = ethers.utils.formatEther(Number(gasPrice[speed]) * Number(gasLimit));
        const _adjustedAmount = calcAdjustedAmount(fee);
  
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
            adjustedAmountWei: ethers.utils.parseEther(Number(_adjustedAmount).toPrecision(8)).toString(),
            maxBalance,
            connect: api.eth.connect,
          };
          api.log('tx data', 'eth.createtx');
          api.log(data);
          const retObj = {
            msg: 'success',
            result: data,
          };

          res.end(JSON.stringify(retObj));
        } else {
          api.eth.connect[coin].sendTransaction({
            to: dest,
            value: adjustedAmountWei,
            gasPrice: Number(gasPrice[speed]),
            gasLimit,
          })
          .then((tx) => {
            api.log('eth tx pushed', 'eth.createtx');
            api.log(tx);
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