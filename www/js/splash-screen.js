// splash-screen.js - Splash screen initialization

/**
 * Hide splash screen after minimum display time
 */
function hideSplashScreen() {
    const splashScreen = document.getElementById('splashScreen');

    if (splashScreen) {
        // Add fade-out class
        splashScreen.classList.add('fade-out');

        // Remove from DOM after animation completes
        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 500); // Match the CSS transition duration
    }
}

/**
 * Initialize splash screen
 * Shows splash for minimum 2 seconds or until app is ready, whichever is longer
 */
function initializeSplashScreen() {
    const minimumDisplayTime = 2000; // 2 seconds minimum
    const startTime = Date.now();

    // Wait for both DOM ready and minimum display time
    const checkReady = () => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = minimumDisplayTime - elapsedTime;

        if (remainingTime > 0) {
            // Still need to wait for minimum display time
            setTimeout(() => {
                hideSplashScreen();
            }, remainingTime);
        } else {
            // Minimum time already elapsed
            hideSplashScreen();
        }
    };

    // For Cordova apps
    if (typeof cordova !== 'undefined') {
        document.addEventListener('deviceready', checkReady, false);
    } else {
        // For web browsers
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkReady);
        } else {
            checkReady();
        }
    }
}

// Initialize splash screen immediately
initializeSplashScreen();