const fs = require('fs');

let c = fs.readFileSync('src/pages/Finance/Billings.tsx', 'utf8');

// Fix Batch Modal
c = c.replace(/\{isBatchModalOpen && \(\s*(<div className="modal-backdrop-v4">)/, '{isBatchModalOpen && createPortal(\n        $1');
c = c.replace(/\)\}\s*<\/div>\s*<\/div>\s*\)\}\s*\{\/\* MODAL EDIT\/DISCOUNT \*\/\}/, ')}\n          </div>\n        </div>\n      ,\n        document.body\n      )}\n\n      {/* MODAL EDIT/DISCOUNT */}');

// Fix Edit Modal
c = c.replace(/\{isEditModalOpen && editingBilling && \(\s*(<div className="modal-backdrop-v4">)/, '{isEditModalOpen && editingBilling && createPortal(\n        $1');
c = c.replace(/\)\}\s*<\/div>\s*<\/div>\s*\)\}\s*\{\/\* MODAL SINGLE BILLING \*\/\}/, ')}\n          </div>\n        </div>\n      ,\n        document.body\n      )}\n\n      {/* MODAL SINGLE BILLING */}');

// Fix Single Modal
c = c.replace(/\{isSingleModalOpen && \(\s*(<div className="modal-backdrop-v4">)/, '{isSingleModalOpen && createPortal(\n        $1');
c = c.replace(/\)\}\s*<\/div>\s*\)\}\s*<\/div>\s*\);\s*\};\s*$/, ')}\n          </div>\n        </div>\n      ,\n        document.body\n      )}\n    </div>\n  );\n};\n');

// Fix paginated students
c = c.replace('setStudents(studentsData);', 'setStudents(Array.isArray(studentsData) ? studentsData : (studentsData.data || []));');

// Make sure createPortal is imported
if (!c.includes('createPortal')) {
    c = c.replace(/import React[^;]*;/, "$&\nimport { createPortal } from 'react-dom';");
}

fs.writeFileSync('src/pages/Finance/Billings.tsx', c);
console.log('Fixed Billings.tsx');
