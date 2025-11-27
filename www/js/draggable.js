// modal-draggable.js - Make modals draggable and resizable

/**
 * Make an element draggable
 * @param {HTMLElement} element - The element to make draggable
 * @param {HTMLElement} handle - The element to use as drag handle (optional)
 */
function makeDraggable(element, handle) {
    const dragHandle = handle || element;
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isDragging = false;

    dragHandle.addEventListener('mousedown', dragMouseDown);

    function dragMouseDown(e) {
        // Only allow dragging from the header, not from buttons or inputs
        if (e.target.tagName === 'BUTTON' ||
            e.target.tagName === 'INPUT' ||
            e.target.tagName === 'SELECT' ||
            e.target.closest('button') ||
            e.target.closest('input') ||
            e.target.closest('select')) {
            return;
        }

        e.preventDefault();
        isDragging = true;

        // Get the mouse cursor position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;

        // Add dragging class for visual feedback
        element.classList.add('dragging');

        document.addEventListener('mouseup', closeDragElement);
        document.addEventListener('mousemove', elementDrag);
    }

    function elementDrag(e) {
        if (!isDragging) return;

        e.preventDefault();

        // Calculate the new cursor position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        // Get current position
        const currentTop = element.offsetTop - pos2;
        const currentLeft = element.offsetLeft - pos1;

        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const elementWidth = element.offsetWidth;
        const elementHeight = element.offsetHeight;

        // Constrain to viewport boundaries (with some padding)
        const minTop = 10;
        const maxTop = viewportHeight - elementHeight - 10;
        const minLeft = 10;
        const maxLeft = viewportWidth - elementWidth - 10;

        // Apply constrained position
        const newTop = Math.max(minTop, Math.min(maxTop, currentTop));
        const newLeft = Math.max(minLeft, Math.min(maxLeft, currentLeft));

        // Remove transform and use top/left positioning
        element.style.transform = 'none';
        element.style.top = newTop + "px";
        element.style.left = newLeft + "px";
    }

    function closeDragElement() {
        isDragging = false;
        element.classList.remove('dragging');
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
    }
}

/**
 * Initialize draggable functionality for prepayment manager
 */
function initializePrepaymentManagerDraggable() {
    const prepaymentManager = document.getElementById('prepaymentManager');
    const prepaymentHeader = document.querySelector('.prepayment-manager-header');

    if (prepaymentManager && prepaymentHeader) {
        makeDraggable(prepaymentManager, prepaymentHeader);
    }
}

/**
 * Initialize draggable functionality for charges manager
 */
function initializeChargesManagerDraggable() {
    const chargesManager = document.getElementById('chargesManager');
    const chargesHeader = document.querySelector('.charges-manager-header');

    if (chargesManager && chargesHeader) {
        makeDraggable(chargesManager, chargesHeader);
    }
}

/**
 * Reset modal position to center
 * @param {HTMLElement} element - The modal element to center
 */
function resetModalPosition(element) {
    element.style.transform = 'translate(-50%, -50%)';
    element.style.top = '50%';
    element.style.left = '50%';
}

/**
 * Enhanced showPrepaymentManager with draggable initialization
 */
const originalShowPrepaymentManager = showPrepaymentManager;
showPrepaymentManager = function (month) {
    originalShowPrepaymentManager(month);

    // Reset position to center
    const prepaymentManager = document.getElementById('prepaymentManager');
    resetModalPosition(prepaymentManager);

    // Initialize draggable (only once)
    if (!prepaymentManager.dataset.draggableInitialized) {
        initializePrepaymentManagerDraggable();
        prepaymentManager.dataset.draggableInitialized = 'true';
    }
};

/**
 * Enhanced showChargesManager with draggable initialization
 */
const originalShowChargesManager = showChargesManager;
showChargesManager = function (month) {
    originalShowChargesManager(month);

    // Reset position to center
    const chargesManager = document.getElementById('chargesManager');
    resetModalPosition(chargesManager);

    // Initialize draggable (only once)
    if (!chargesManager.dataset.draggableInitialized) {
        initializeChargesManagerDraggable();
        chargesManager.dataset.draggableInitialized = 'true';
    }
};

// Initialize draggable functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    // Note: We don't initialize here because modals are hidden
    // They will be initialized when first shown
});

// Handle window resize - keep modals within viewport
window.addEventListener('resize', function () {
    const prepaymentManager = document.getElementById('prepaymentManager');
    const chargesManager = document.getElementById('chargesManager');

    // If modal is visible, ensure it stays within viewport
    if (prepaymentManager && prepaymentManager.classList.contains('show')) {
        const rect = prepaymentManager.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (rect.right > viewportWidth || rect.bottom > viewportHeight ||
            rect.left < 0 || rect.top < 0) {
            resetModalPosition(prepaymentManager);
        }
    }

    if (chargesManager && chargesManager.classList.contains('show')) {
        const rect = chargesManager.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (rect.right > viewportWidth || rect.bottom > viewportHeight ||
            rect.left < 0 || rect.top < 0) {
            resetModalPosition(chargesManager);
        }
    }
});