import fs from 'fs';

let js = fs.readFileSync('public/theme/js/buro-modules.min.js', 'utf-8');

// Find the block where slideDown and slideUp are used in the appended script
// We need to change:
// $title.next().addClass('ui-accordion-content-active').slideDown(400);
// to:
// $title.next().slideDown(400, function(){ $(this).addClass('ui-accordion-content-active'); });
// and for slideUp:
// $contents.not($title.next()).removeClass('ui-accordion-content-active').slideUp(400);
// to:
// $contents.not($title.next()).slideUp(400, function(){ $(this).removeClass('ui-accordion-content-active'); });

js = js.replace(/\.addClass\('ui-accordion-content-active'\)\.slideDown\(400\)/g, ".slideDown(400, function(){ jQuery(this).addClass('ui-accordion-content-active'); })");
js = js.replace(/\.removeClass\('ui-accordion-content-active'\)\.slideUp\(400\)/g, ".slideUp(400, function(){ jQuery(this).removeClass('ui-accordion-content-active'); })");

fs.writeFileSync('public/theme/js/buro-modules.min.js', js);
console.log('Fixed animations in buro-modules.min.js');
