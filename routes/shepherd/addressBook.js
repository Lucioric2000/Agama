const fs = require('fs-extra');

module.exports = (shepherd) => {
  /*
   *  type: POST
   *  params: none
   */
  shepherd.post('/addressbook', async (req, res, next) => {
    const token = req.body.token;
    const data = req.body.data;

    if (shepherd.checkToken(req.body.token)) {
      fs.writeFile(`${shepherd.agamaDir}/shepherd/addressBook.json`, JSON.stringify(data), (err) => {
        if (err) {
          shepherd.log('error writing address book file');

          const returnObj = {
            msg: 'error',
            result: 'error writing address book file',
          };

          res.end(JSON.stringify(returnObj));
        } else {
          const returnObj = {
            msg: 'success',
            result: 'address book is updated',
          };

          res.end(JSON.stringify(returnObj));
        }
      });
    } else {
      const errorObj = {
        msg: 'error',
        result: 'unauthorized access',
      };

      res.end(JSON.stringify(errorObj));
    }
  });

  shepherd.get('/addressbook', (req, res, next) => {
    if (shepherd.checkToken(req.query.token)) {
      if (fs.existsSync(`${shepherd.agamaDir}/shepherd/addressBook.json`)) {
        fs.readFile(`${shepherd.agamaDir}/shepherd/addressBook.json`, 'utf8', (err, data) => {
          if (err) {
            const errorObj = {
              msg: 'error',
              result: err,
            };

            res.end(JSON.stringify(errorObj));
          } else {
            const returnObj = {
              msg: 'success',
              result: JSON.parse(data),
            };

            res.end(JSON.stringify(returnObj));
          }
        });
      } else {
        const errorObj = {
          msg: 'error',
          result: 'address book doesn\'t exist',
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