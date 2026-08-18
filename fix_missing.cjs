const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('c:/Users/user/Downloads/sim/sistem-manajemen-sekolah-frontend/src/pages');

let fixed = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Find if file has ", document.body" at the end but doesn't have createPortal at the beginning of the condition
    if (content.includes('document.body')) {
        // Find all conditions like {someCondition && (
        // that precede <div className="modal-backdrop-v4">
        
        let match;
        const regex = /\{([a-zA-Z0-9_]+)\s*&&\s*\(\s*(<div className="modal-backdrop-v4")/g;
        
        let modified = false;
        content = content.replace(regex, (match, p1, p2) => {
            modified = true;
            return `{${p1} && createPortal(\n        ${p2}`;
        });
        
        if (modified) {
            fs.writeFileSync(file, content);
            fixed++;
            console.log("Fixed missing createPortal in: " + file);
        }
    }
});
console.log("Total fixed: " + fixed);
