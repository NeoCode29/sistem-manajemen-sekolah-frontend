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

let updatedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    if (content.includes('className="modal-backdrop-v4"') && !content.includes('createPortal(')) {
        if (!content.includes('import { createPortal }')) {
            content = content.replace(/import React[^;]*;/, "$&\nimport { createPortal } from 'react-dom';");
        }
        
        // We want to capture everything inside {showModal && ( ... )}
        // Since regex for matching balanced parentheses is hard, we'll find the last `)}` before the end of the file.
        // Typically it looks like:
        //       )}
        //     </div>
        //   );
        // };
        // So we can replace `{showModal && (` with `{showModal && createPortal(`
        // and replace the corresponding `)}` with `), document.body)}`
        
        content = content.replace(/\{showModal\s*&&\s*\(/, "{showModal && createPortal(");
        
        // Find the last `)}` before the component closing tag.
        // It's usually right before `</div>\n  );`
        content = content.replace(/\)\}\s*<\/div>\s*\);\s*\};\s*$/, ",\n        document.body\n      )}\n    </div>\n  );\n};\n");
        
        fs.writeFileSync(file, content);
        updatedFiles++;
        console.log("Updated: " + file);
    }
});
console.log("Total updated: " + updatedFiles);
