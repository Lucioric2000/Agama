module.exports = (api) => {
  api.get('/electrum/estimatefee', (req, res, next) => {
    if (api.checkToken(req.query.token)) {
      const ecl = api.ecl(req.query.network);

      ecl.connect();
      ecl.blockchainEstimatefee(req.query.blocks)
      .then((json) => {
        ecl.close();
        api.log(`electrum estimatefee ${json}`, 'spv.estimatefee');

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

  api.estimateTxSize = (numVins, numOuts) => {
    // in x 180 + out x 34 + 10 plus or minus in
    return numVins * 180 + numOuts * 34 + 11;
  }

  return api;
};