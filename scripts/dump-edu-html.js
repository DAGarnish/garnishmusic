const { execSync } = require('child_process');
const html = execSync('curl -s http://localhost:3000/').toString();
const idx1 = html.indexOf('mkd-portfolio-list-holder-outer');
const idx2 = html.indexOf('Some of our partners');
if (idx1 !== -1 && idx2 !== -1) {
    console.log(html.slice(idx2 - 800, idx2 + 200));
} else {
    console.log('Not found on localhost:3000');
}
