#!/usr/bin/env node
/**
 * Generate an ADMIN_PASSWORD_HASH line for .env.local.
 *
 * Usage:
 *   npm run hash          # interactive — masks input as ****
 *   npm run hash -- mypw  # one-shot (only safe in trusted shells)
 *
 * Output format:
 *   ADMIN_PASSWORD_HASH=<salt-hex>:<scrypt-hash-hex>
 *
 * Algorithm: scrypt(password, salt=16 bytes random, keylen=64 bytes).
 * Memory-hard, RFC 7914, Node built-in — no dependencies.
 */

const crypto = require('crypto');
const readline = require('readline');

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

function promptHidden(question) {
  return new Promise((resolve, reject) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
      // Fall back to plain readline if we can't enable raw mode.
      const rl = readline.createInterface({ input: stdin, output: process.stdout });
      rl.question('', (answer) => { rl.close(); resolve(answer); });
      return;
    }
    let buf = '';
    const onData = (chunk) => {
      const ch = chunk.toString('utf8');
      for (const c of ch) {
        if (c === '\r' || c === '\n') {
          stdin.removeListener('data', onData);
          stdin.setRawMode(false);
          stdin.pause();
          process.stdout.write('\n');
          return resolve(buf);
        }
        if (c === '') { // Ctrl-C
          stdin.removeListener('data', onData);
          stdin.setRawMode(false);
          stdin.pause();
          process.stdout.write('\n');
          process.exit(130);
        }
        if (c === '' || c === '\b') {
          if (buf.length > 0) {
            buf = buf.slice(0, -1);
            process.stdout.write('\b \b');
          }
        } else {
          buf += c;
          process.stdout.write('*');
        }
      }
    };
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

(async () => {
  // Allow one-shot via arg (handy for CI / scripts; the shell history sees it).
  const argPw = process.argv[2];
  let pw;
  if (argPw) {
    pw = argPw;
  } else {
    pw = await promptHidden('Enter new admin password: ');
    if (!pw) {
      console.error('Empty password — aborting.');
      process.exit(1);
    }
    const confirm = await promptHidden('Confirm password:        ');
    if (pw !== confirm) {
      console.error('Passwords do not match — aborting.');
      process.exit(1);
    }
  }

  const line = `ADMIN_PASSWORD_HASH=${hashPassword(pw)}`;

  console.log('\nPaste this single line into .env.local (replace the old ADMIN_PASSWORD_HASH line):\n');
  console.log(line);
  console.log('\nThen restart the dev server.');
})();
