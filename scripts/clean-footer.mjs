import fs from 'fs';
import path from 'path';

const footerPath = path.join(process.cwd(), 'components/theme-html/footer.html');
let content = fs.readFileSync(footerPath, 'utf8');

// Regex to match the entire mkd-separator-holder block
const regex = /<div class="mkd-separator-holder clearfix\s*mkd-separator-left">[\s\S]*?<\/div>\s*<\/div>/g;

const newContent = content.replace(regex, '');

fs.writeFileSync(footerPath, newContent, 'utf8');

console.log("Removed separators from footer.html");
