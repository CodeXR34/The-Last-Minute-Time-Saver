const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 375, height: 812 });
  
  await page.goto('http://localhost:5174/dashboard', { waitUntil: 'networkidle2' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const report = await page.evaluate(() => {
    let result = [];
    
    const docWidth = document.documentElement.scrollWidth;
    const vpWidth = window.innerWidth;
    
    if (docWidth <= vpWidth) {
      return [{ tag: 'none', msg: 'No horizontal overflow detected: doc ' + docWidth + ' vp ' + vpWidth }];
    }
    
    function checkElement(el) {
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
      
      const rect = el.getBoundingClientRect();
      if (rect.right > window.innerWidth || rect.width > window.innerWidth) {
        const style = window.getComputedStyle(el);
        
        let path = [];
        let curr = el;
        while (curr && curr.tagName) {
          const comp = window.getComputedStyle(curr);
          path.push({
            tag: curr.tagName,
            classes: curr.className,
            width: comp.width,
            minWidth: comp.minWidth,
            maxWidth: comp.maxWidth,
            overflowX: comp.overflowX,
            display: comp.display,
            flex: comp.flex,
            padding: comp.padding,
            margin: comp.margin,
            boxSizing: comp.boxSizing,
            position: comp.position,
            rectRight: curr.getBoundingClientRect().right,
            rectWidth: curr.getBoundingClientRect().width
          });
          curr = curr.parentElement;
        }
        
        result.push({
          el: el.tagName + '.' + Array.from(el.classList).join('.'),
          width: rect.width,
          right: rect.right,
          hierarchy: path
        });
      }
      
      for (let i = 0; i < el.children.length; i++) {
        checkElement(el.children[i]);
      }
    }
    
    checkElement(document.body);
    return result;
  });
  
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})();
