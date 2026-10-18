// Some restricted Windows accounts cannot resolve the OS user through libuv.
// Node test tooling only needs a stable temp-directory suffix in that case.
const os = require('node:os');
try {
  os.userInfo();
} catch {
  os.userInfo = () => ({ username: 'ilmora' });
}
