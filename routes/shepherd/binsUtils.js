const os = require('os');
const fsnode = require('fs');
const _fs = require('graceful-fs');
const exec = require('child_process').exec;

module.exports = (shepherd) => {
  // osx and linux
  shepherd.binFixRights = () => {
    const osPlatform = os.platform();
    const _bins = [
      shepherd.komododBin,
      shepherd.komodocliBin
    ];

    if (osPlatform === 'darwin' ||
        osPlatform === 'linux') {
      for (let i = 0; i < _bins.length; i++) {
        _fs.stat(_bins[i], (err, stat) => {
          if (!err) {
            if (parseInt(stat.mode.toString(8), 10) !== 100775) {
              shepherd.log(`${_bins[i]} fix permissions`, 'native.confd');
              fsnode.chmodSync(_bins[i], '0775');
            }
          } else {
            shepherd.log(`error: ${_bins[i]} not found`, 'native.confd');
          }
        });
      }
    }
  }

  shepherd.killRogueProcess = (processName) => {
    // kill rogue process copies on start
    const osPlatform = os.platform();
    let processGrep;

    switch (osPlatform) {
      case 'darwin':
        processGrep = "ps -p $(ps -A | grep -m1 " + processName + " | awk '{print $1}') | grep -i " + processName;
        break;
      case 'linux':
        processGrep = 'ps -p $(pidof ' + processName + ') | grep -i ' + processName;
        break;
      case 'win32':
        processGrep = 'tasklist';
        break;
    }

    exec(processGrep, (error, stdout, stderr) => {
      if (stdout.indexOf(processName) > -1) {
        const pkillCmd = osPlatform === 'win32' ? `taskkill /f /im ${processName}.exe` : `pkill -15 ${processName}`;

        shepherd.log(`found another ${processName} process(es)`, 'native.process');
        shepherd.writeLog(`found another ${processName} process(es)`);

        shepherd.exec(pkillCmd, (error, stdout, stderr) => {
          shepherd.log(`${pkillCmd} is issued`, 'native.process');
          shepherd.writeLog(`${pkillCmd} is issued`);

          if (error !== null) {
            shepherd.log(`${pkillCmd} exec error: ${error}`, 'native.process');
            shepherd.writeLog(`${pkillCmd} exec error: ${error}`);
          };
        });
      }

      if (error !== null) {
        shepherd.log(`${processGrep} exec error: ${error}`, 'native.process');
        shepherd.writeLog(`${processGrep} exec error: ${error}`);
      };
    });
  }

  return shepherd;
};