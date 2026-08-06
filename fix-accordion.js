const fs = require('fs');
let code = fs.readFileSync('public/theme/js/buro-modules.min.js', 'utf8');

const target = `if(b.hasClass("mkd-accordion")&&b.accordion({animate:"swing",collapsible:!0,active:!1,icons:"",heightStyle:"content"}),b.hasClass("mkd-toggle")){var c=a(this),d=c.find(".mkd-title-holder"),e=d.next();c.addClass("accordion ui-accordion ui-accordion-icons ui-widget ui-helper-reset"),d.addClass("ui-accordion-header ui-state-default ui-corner-top ui-corner-bottom"),e.addClass("ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom").hide(),d.each(function(){var b=a(this);b.on("mouseenter mouseleave",function(){b.toggleClass("ui-state-hover")}),b.on("click",function(){b.toggleClass("ui-accordion-header-active ui-state-active ui-state-default ui-corner-bottom"),b.next().toggleClass("ui-accordion-content-active").slideToggle(400)})})}`;

const replacement = `if(b.hasClass("mkd-accordion") || b.hasClass("mkd-toggle")){var c=a(this),d=c.find(".mkd-title-holder"),e=d.next();c.addClass("accordion ui-accordion ui-accordion-icons ui-widget ui-helper-reset"),d.addClass("ui-accordion-header ui-state-default ui-corner-top ui-corner-bottom"),e.addClass("ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom").hide(),d.each(function(){var b=a(this);b.on("mouseenter mouseleave",function(){b.toggleClass("ui-state-hover")}),b.on("click",function(){if(c.hasClass("mkd-accordion")){if(!b.hasClass("ui-state-active")){d.not(b).removeClass("ui-accordion-header-active ui-state-active ui-corner-bottom").addClass("ui-state-default");e.not(b.next()).removeClass("ui-accordion-content-active").slideUp(400);b.addClass("ui-accordion-header-active ui-state-active ui-corner-bottom").removeClass("ui-state-default");b.next().addClass("ui-accordion-content-active").slideDown(400);}else{b.removeClass("ui-accordion-header-active ui-state-active ui-corner-bottom").addClass("ui-state-default");b.next().removeClass("ui-accordion-content-active").slideUp(400);}}else{b.toggleClass("ui-accordion-header-active ui-state-active ui-state-default ui-corner-bottom"),b.next().toggleClass("ui-accordion-content-active").slideToggle(400);}})})}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('public/theme/js/buro-modules.min.js', code);
  console.log("Replaced successfully!");
} else {
  console.log("Target not found!");
}
