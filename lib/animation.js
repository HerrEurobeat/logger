/*
 * File: animation.js
 * Project: output-logger
 * Created Date: 2022-01-19 15:49:47
 * Author: 3urobeat
 *
 * Last Modified: 2024-12-22 15:41:54
 * Modified By: 3urobeat
 *
 * Copyright (c) 2022 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * Licensed under the MIT license: https://opensource.org/licenses/MIT
 * Permission is granted to use, copy, modify, and redistribute the work.
 * Full license information available in the project LICENSE file.
 */


const printManager = require("./helpers/printManager.js");
const Const        = require("./data/constants.json");
const animations   = require("./data/animations.json");
const optionsObj   = require("./options").optionsObj;

let lastLogReprint;
let frame;
let activeAnimation;
let lastAnimation;
let lastAnimationRefresh;

module.exports.lastLogReprint  = lastLogReprint;  // Export these values to be able to use them from outside this file
module.exports.activeAnimation = activeAnimation;

/**
 * Keeps the animation running between logger calls
 * @param {string} tempStr The string the that will be logged later with the animation field still untouched
 * @param {array} animation The current animation array
 */
function animationUpdateInterval(tempStr, animation) {
    activeAnimation = setInterval(() => {

        frame++;
        if (frame > animation.length - 1) frame = 0; // Reset animation if last frame was reached

        let modStr = require("./helpers/removeEmptyParams.js").removeEmptyParams(tempStr.replace(Const.ANIMATION, animation[frame]));
        printManager.log("", modStr, true);

        lastAnimationRefresh = Date.now();

    }, optionsObj.animationinterval);

    // Update exported activeAnimation value
    module.exports.activeAnimation = activeAnimation;
}


/**
 * Handles everything regarding animations
 * @param {object} params The parameters the user called logger with
 * @param {string} tempStr The current string that will be logged later
 * @returns {string} The modified string
 */
module.exports.handleAnimation = (params, tempStr) => {

    // Let stopAnimation() handle clearing and reprinting of current animation so we can work on showing the new message that clears the current animation or show a new animation
    this.stopAnimation();

    // Make copy of tempStr
    let modStr = tempStr;


    // Get correct animation frame, replace animation field and start interval
    let animation = params[Const.ANIMATION];

    if (params[Const.ANIMATION]) {
        if (lastAnimation && lastAnimation == animation) { // If the last animation is the same as this one, then continue with the next frame instead of restarting the animation

            // Skip to next frame if last refresh is older than animationinterval to prevent animation frame getting stuck when this function is called more often than the interval would need to run at least once
            if (Date.now() - lastAnimationRefresh >= optionsObj.animationinterval) {
                frame++;
                if (frame > animation.length - 1) frame = 0; // Reset animation if last frame was reached

                lastAnimationRefresh = Date.now();
            }
        } else {
            frame = 0;
            lastAnimationRefresh = 0;
        }

        // Remember which animation was last used
        lastAnimation = animation;

        // Put correct animation frame into the string and hide cursor so that it won't block the animation
        modStr = tempStr.replace(Const.ANIMATION, animation[frame]);

        // If this message should not be removed then we need to reprint it on the next call without the animation field
        if (!params.remove) lastLogReprint = require("./helpers/removeEmptyParams.js").removeEmptyParams(tempStr);

        // Start interval that keeps the animation running between logger calls
        animationUpdateInterval(tempStr, animation);
    }

    // Update exported lastLogReprint value
    module.exports.lastLogReprint = lastLogReprint;

    // Return our modified version of the string
    return modStr;
};


/**
 * Returns the array of frames for the provided animation name
 * @param {string} animation Valid animation names: `loading`, `waiting`, `bounce`, `progress`, `arrows` or `bouncearrows`
 * @returns {array.<string>} Array containing all frames as strings of the chosen animation
 */
module.exports.animation = (animation) => {
    return animations[animation];
};


/**
 * Stops any currently running animation
 */
module.exports.stopAnimation = () => {
    if (!activeAnimation || activeAnimation._destroyed) return; // Ignore request if no animation is active

    // clear interval of animation currently running
    clearInterval(activeAnimation);

    // Update exported activeAnimation value
    module.exports.activeAnimation = activeAnimation;

    printManager.log("animationRemove");
};
