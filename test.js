const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

const overlay = document.getElementById('overlay');
// simulate start screen state
overlay.style.display = 'flex';
const focusables = Array.from(overlay.querySelectorAll('button, input, a[href], [tabindex="0"]'))
//    .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0 && !el.disabled);
// JSDOM doesn't support offsetWidth, just list them all
focusables.forEach((el, i) => console.log(i, el.tagName, el.className, el.textContent.trim()));

