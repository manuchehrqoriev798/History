export function initializeRichTextEditor(textareaId) {
    const originalTextarea = document.getElementById(textareaId);
    
    // Create and insert an editable div
    const editableDiv = document.createElement('div');
    editableDiv.contentEditable = true;
    editableDiv.className = 'editable-content';
    editableDiv.style.cssText = `
        min-height: 200px;
        padding: 12px;
        border: 1px solid var(--accent-color);
        border-radius: var(--border-radius);
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-family: 'Crimson Text', serif;
        line-height: 1.6;
        white-space: pre-wrap;
        overflow-y: auto;
        font-size: 14px;
    `;
    
    // Insert editable div before textarea
    originalTextarea.parentNode.insertBefore(editableDiv, originalTextarea);

    // Keep textarea and localStorage in sync with editable div
    const updateContent = () => {
        const content = editableDiv.innerHTML;
        originalTextarea.value = content;
        localStorage.setItem(`editor_${textareaId}`, content);
    };

    // Initialize content from localStorage or textarea
    const savedContent = localStorage.getItem(`editor_${textareaId}`) || originalTextarea.value;
    if (savedContent) {
        editableDiv.innerHTML = savedContent;
        originalTextarea.value = savedContent;
    }

    // Update on input and blur
    editableDiv.addEventListener('input', updateContent);
    editableDiv.addEventListener('blur', updateContent);

    // Handle form submission
    if (originalTextarea.form) {
        const form = originalTextarea.form;
        form.addEventListener('submit', (e) => {
            // Update content one final time before submission
            updateContent();
            
            // Store the content for restoration after submission
            const contentBeforeSubmit = editableDiv.innerHTML;
            
            // After a successful submission
            setTimeout(() => {
                editableDiv.innerHTML = contentBeforeSubmit;
                originalTextarea.value = contentBeforeSubmit;
                localStorage.setItem(`editor_${textareaId}`, contentBeforeSubmit);
            }, 0);
        });
    }

    // Track current format state
    let currentFormats = {
        bold: false,
        italic: false,
        underline: false,
        fontSize: '3',
        color: '#000000',
        fontFamily: "'Times New Roman', serif"
    };
    
    // Instead of hiding the textarea, position it off-screen
    originalTextarea.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        opacity: 0;
        height: 0;
        width: 0;
        padding: 0;
        margin: 0;
    `;

    // Apply current formats to selection or cursor position
    function applyCurrentFormats() {
        if (currentFormats.bold) document.execCommand('bold', false, null);
        if (currentFormats.italic) document.execCommand('italic', false, null);
        if (currentFormats.underline) document.execCommand('underline', false, null);
        
        const selection = window.getSelection();
        if (selection.rangeCount) {
            const range = selection.getRangeAt(0);
            if (range.collapsed) {
                const span = document.createElement('span');
                span.style.fontSize = getFontSize(currentFormats.fontSize);
                span.style.color = currentFormats.color;
                span.style.fontFamily = currentFormats.fontFamily;
                span.innerHTML = '&#8203;'; // Zero-width space
                range.insertNode(span);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    // Initialize format tracking
    const formatButtons = document.querySelectorAll('.format-btn');
    
    formatButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const format = button.dataset.format;
            
            if (format === 'indent' || format === 'outdent') {
                handleIndentation(editableDiv, format);
                return;
            }

            if (['bold', 'italic', 'underline'].includes(format)) {
                currentFormats[format] = !currentFormats[format];
                document.execCommand(format, false, null);
                button.classList.toggle('active', currentFormats[format]);
            } 
            else if (format === 'fontSize') {
                currentFormats.fontSize = button.value;
                const size = getFontSize(button.value);
                const selection = window.getSelection();
                if (selection.rangeCount) {
                    const range = selection.getRangeAt(0);
                    if (range.toString().length > 0) {
                        const span = document.createElement('span');
                        span.style.fontSize = size;
                        range.surroundContents(span);
                    } else {
                        applyCurrentFormats();
                    }
                }
            }
            else if (format === 'color') {
                currentFormats.color = button.value;
                document.execCommand('foreColor', false, button.value);
            }
            else if (format === 'fontFamily') {
                currentFormats.fontFamily = button.value;
                const selection = window.getSelection();
                if (selection.rangeCount) {
                    const range = selection.getRangeAt(0);
                    if (range.toString().length > 0) {
                        const span = document.createElement('span');
                        span.style.fontFamily = button.value;
                        range.surroundContents(span);
                    } else {
                        applyCurrentFormats();
                    }
                }
            }

            editableDiv.focus();
        });
    });

    // Handle keyboard input
    editableDiv.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            // Preserve formats after new line
            setTimeout(() => applyCurrentFormats(), 0);
        }
    });

    // Update formats when text is pasted
    editableDiv.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.originalEvent || e).clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
        applyCurrentFormats();
    });
}

function handleIndentation(editableDiv, action) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const startNode = range.startContainer;
    
    // Find the closest block-level element
    let currentBlock = startNode.nodeType === 3 ? startNode.parentNode : startNode;
    while (currentBlock && !isBlockLevel(currentBlock)) {
        currentBlock = currentBlock.parentNode;
    }

    if (currentBlock) {
        document.execCommand(action === 'indent' ? 'indent' : 'outdent', false, null);
    }
}

function isBlockLevel(node) {
    const blockElements = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI'];
    return blockElements.includes(node.nodeName);
}

// Helper function to convert fontSize value to actual size
function getFontSize(value) {
    const sizes = {
        '1': '14px',  // Small
        '2': '18px',  // Normal
        '3': '20px',  // Default size
        '4': '24px',  // Large
        '5': '32px'   // Larger
    };
    return sizes[value] || '20px';
} 