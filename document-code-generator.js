// Updated regex: allow 0-2 optional sub-departments (each 2+ chars), e.g. AOC-DEPT-SUB-SUBSUB-TYPE-EXTRA
const DOCUMENT_CODE_PATTERN = /^[A-Z]{2,5}-[A-Z0-9]{2,}(?:-[A-Z0-9]{2,}){0,2}-[A-Z]{2,8}(?:-[A-Z0-9]+)*$/;

// Cache frequently used DOM elements
const form = document.getElementById('codeForm');
const aocField = document.getElementById('aoc');
const deptField = document.getElementById('department');
const subDeptField = document.getElementById('subDepartment');
const subSubDeptField = document.getElementById('subSubDepartment');
const typeField = document.getElementById('docType');
const extraField = document.getElementById('extraField');
const codeOutput = document.getElementById('codeOutput');
const errorBox = document.getElementById('errorBox');
const errorMessage = document.getElementById('errorMessage');
const errorRecommendation = document.getElementById('errorRecommendation');

form.addEventListener('submit', function(event) {
    event.preventDefault();
    generateCode();
});

function validateInputs() {
    const inputs = {
        aoc: aocField.value.trim().toUpperCase(),
        deptInput: deptField.value.trim().toUpperCase(),
        subDeptInput: subDeptField.value.trim().toUpperCase(),
        subSubDeptInput: subSubDeptField.value.trim().toUpperCase(),
        type: typeField.value.trim().toUpperCase(),
        extraInput: extraField.value.trim().toUpperCase()
    };

    let missingInputs = [];
    if (!inputs.aoc) missingInputs.push("AOC");
    if (!inputs.deptInput) {
        missingInputs.push("Department");
    } else if (inputs.deptInput.length < 2 || !/^[A-Z0-9]+$/.test(inputs.deptInput) || /\s|[^A-Z0-9]/.test(inputs.deptInput)) {
        missingInputs.push("Department (must be at least 2 uppercase alphanumeric characters without spaces or special characters)");
    }
    if (inputs.subDeptInput && (inputs.subDeptInput.length < 2 || !/^[A-Z0-9]+$/.test(inputs.subDeptInput) || /\s|[^A-Z0-9]/.test(inputs.subDeptInput))) {
        missingInputs.push("Division (must be at least 2 uppercase alphanumeric characters without spaces or special characters)");
    }
    if (inputs.subSubDeptInput && (inputs.subSubDeptInput.length < 2 || !/^[A-Z0-9]+$/.test(inputs.subSubDeptInput) || /\s|[^A-Z0-9]/.test(inputs.subSubDeptInput))) {
        missingInputs.push("Unit (must be at least 2 uppercase alphanumeric characters without spaces or special characters)");
    }
    if (!inputs.type) missingInputs.push("Document Type");

    return { ...inputs, missingInputs };
}

function displayCode(code, missingInputs, error) {
    const errorBoxClass = 'visible-error';

    // Reset field borders
    extraField.style.borderColor = '';
    subDeptField.style.borderColor = '';
    subSubDeptField.style.borderColor = '';

    if (missingInputs && missingInputs.length > 0) {
        codeOutput.textContent = '';
        errorBox.style.display = 'block';
        errorBox.classList.add(errorBoxClass);
        errorMessage.textContent = `Missing fields: ${missingInputs.join(", ")}`;
        errorRecommendation.textContent = "Please fill in all required fields and try again.";
        // Highlight subDepartment/subSubDepartment if error
        if (missingInputs.some(msg => msg.startsWith('Sub Department'))) {
            subDeptField.style.borderColor = '#cc0033';
        }
        if (missingInputs.some(msg => msg.startsWith('Sub Sub Department'))) {
            subSubDeptField.style.borderColor = '#cc0033';
        }
    } else if (error) {
        codeOutput.textContent = '';
        errorBox.style.display = 'block';
        errorBox.classList.add(errorBoxClass);
        if (error.type === 'ValidationError') {
            errorMessage.textContent = error.message;
            errorRecommendation.textContent = "Recommendations:\n" +
                "- Optional text: only uppercase Latin letters, numbers, or dashes\n" +
                "- Sub Department: only uppercase Latin letters and numbers, at least 2 characters\n" +
                "- Sub Sub Department: only uppercase Latin letters and numbers, at least 2 characters\n" +
                "Please correct the highlighted field below.";
            if (error.field === 'extraField') {
                extraField.style.borderColor = '#cc0033';
            }
            if (error.field === 'subDepartment') {
                subDeptField.style.borderColor = '#cc0033';
            }
            if (error.field === 'subSubDepartment') {
                subSubDeptField.style.borderColor = '#cc0033';
            }
        } else {
            errorMessage.textContent = "An unexpected error occurred.";
            errorRecommendation.textContent = "Please try again later or contact support.";
        }
    } else {
        errorBox.style.display = 'none';
        errorBox.classList.remove(errorBoxClass);
        errorRecommendation.textContent = '';
        codeOutput.textContent = code;
    }
}

// Helper to transform inputs by trimming and converting to uppercase
function transformInputs({ aoc, deptInput, subDeptInput, subSubDeptInput, type, extraInput }) {
    return {
        dept: deptInput,
        subDept: subDeptInput,
        subSubDept: subSubDeptInput,
        extra: extraInput
    };
}

function validateCodeFormat(code, extra, subDept, subSubDept) {
    let errors = [];
    if (subDept && !/^[A-Z0-9]{2,}$/.test(subDept)) {
        errors.push('Sub Department: only uppercase letters and numbers, at least 2 characters');
    }
    if (subSubDept && !/^[A-Z0-9]{2,}$/.test(subSubDept)) {
        errors.push('Sub Sub Department: only uppercase letters and numbers, at least 2 characters');
    }
    if (extra && !/^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(extra)) {
        errors.push('Optional text: only uppercase letters, numbers, or dashes');
    }
    if (!DOCUMENT_CODE_PATTERN.test(code)) {
        errors.push(`Generated code format is invalid. Invalid code: ${code}`);
    }
    if (errors.length > 0) {
        const error = new Error(errors.join('\n'));
        if (errors[0].startsWith('Sub Department')) error.field = 'subDepartment';
        if (errors[0].startsWith('Sub Sub Department')) error.field = 'subSubDepartment';
        if (errors[0].startsWith('Optional text')) error.field = 'extraField';
        error.type = 'ValidationError';
        throw error;
    }
}

function generateDocumentCode(aoc, dept, subDept, subSubDept, type, extra) {
    let code = `${aoc}-${dept}`;
    if (subDept) {
        code += `-${subDept}`;
    }
    if (subSubDept) {
        code += `-${subSubDept}`;
    }
    code += `-${type}`;
    if (extra) {
        // Only allow uppercase letters, numbers, or dashes in extra
        if (!/^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(extra)) {
            const error = new Error('Optional text must contain only uppercase letters, numbers, or dashes');
            error.type = 'ValidationError';
            error.field = 'extraField';
            throw error;
        }
        code += `-${extra}`;
    }
    try {
        validateCodeFormat(code, extra, subDept, subSubDept);
    } catch (err) {
        throw err;
    }
    return code;
}

// Main code to handle form submission
function generateCode() {
    const { aoc, deptInput, subDeptInput, subSubDeptInput, type, extraInput, missingInputs } = validateInputs();
    if (missingInputs.length > 0) {
        displayCode('', missingInputs, null);
        return;
    }
    const { dept, subDept, subSubDept, extra } = transformInputs({ aoc, deptInput, subDeptInput, subSubDeptInput, type, extraInput });
    try {
        const code = generateDocumentCode(aoc, dept, subDept, subSubDept, type, extra);
        displayCode(code, [], null);
    } catch (err) {
        displayCode('', [], err);
    }
}
