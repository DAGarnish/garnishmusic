import fs from 'fs';
import path from 'path';

const footerPath = path.join(process.cwd(), 'components/theme-html/footer.html');
let content = fs.readFileSync(footerPath, 'utf8');

// Regex to match empty ul structures
const regex = /<ul[^>]*>\s*<li[^>]*>\s*<ul[^>]*>\s*<\/ul>\s*<\/li>\s*<\/ul>/g;

const newContent = content.replace(regex, '');

if (content !== newContent) {
  fs.writeFileSync(footerPath, newContent, 'utf8');
  console.log("Removed empty list items from footer.html");
} else {
  console.log("No empty list items found.");
}
