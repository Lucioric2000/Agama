/* This module exports the api tokens and the wallet private keys for which the random seed is known for easing use of API from third party software. Disable it in ../api.js if you have security concerns.*/
module.exports = (api) => {
  /*
   *  type: GET
   *  params: none
   */
  api.get('/token', async (req, res, next) => {
    res.end(api.appSessionHash);
  });
  api.get('/keys', async (req, res, next) => {
    if (api.checkToken(req.body.token)) {
      const retObj = {
        msg: 'success',
        priv: api.elections.priv,
        pub: api.elections.pub,
      };
    } else {
      const retObj = {
        msg: 'error',
        result: 'unauthorized access',
      };
    }
    res.end(JSON.stringify(retObj));
  });
  return api;
};
