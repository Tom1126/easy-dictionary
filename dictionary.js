document.addEventListener('dblclick', showMeaning);
document.addEventListener('click', removeMeaning);

var createdDiv;

// Listens for background script message to call function:
browser.runtime.onMessage.addListener(function (message, sender, callback) {
    if (message.functiontoInvoke == "showMeaning") {        
        showMeaningContext();
    }
});

/**
 * Function to generate the popup box containing the meaning 
 * @param {HTMLEvent} event Text to capture from user double clicked 
 */
function showMeaning(event) {
    var info = getSelectionInfo(event); // Get the text user selected
    if (!info) {
        return; // exits the function when the text selected is empty
    }

    sendRequest(info); // Send requests to Google to get the meaning and synoymns of the work
    createdDiv = createDiv(info); // Create the popup box for the word the user searched
}

function showMeaningContext() {
    var info = getSelectionInfoContext(); // Get the text user selected
    if (!info) {
        return; // exits the function when the text selected is empty
    }
    
    sendRequest(info); // Send requests to Google to get the meaning and synoymns of the work
    createdDiv = createDivContext(info); // Create the popup box for the word the user searched
}

/**
 * Function to draw the text that the user has double clicked
 * @param {HTMLEvent} event 
 */
function getSelectionInfo(event) {
    var word;
    var boundingRect;
    var ifZero = {};

    if (window.getSelection().toString().length > 1) {
        word = window.getSelection().toString();
        boundingRect = getSelectionCoords(window.getSelection());
    } else {
        return null;
    }

    var top = boundingRect.top + window.scrollY;
    var bottom = boundingRect.bottom + window.scrollY;
    var left = boundingRect.left + window.scrollX;

    if (boundingRect.height == 0) {
        top = event.pageY;
        bottom = event.pageY;
        left = event.pageX;
    }

    var toReturn = {
        top: top,
        bottom: bottom,
        left: left,
        word: word,
        clientY: event.clientY,
        height: boundingRect.height
    };
    return toReturn;
}

/**
 * Function to get information needed for the creation of the pop up box
 */
function getSelectionInfoContext() {
    var word;
    var boundingRect;
    var ifZero = {};

    if (window.getSelection().toString().length > 1) {
        word = window.getSelection().toString();
        boundingRect = getSelectionCoords(window.getSelection());
        console.log(word);
    } else {
        return null;
    }

    var top = boundingRect.top + window.scrollY;
    var bottom = boundingRect.bottom + window.scrollY;
    var left = boundingRect.left + window.scrollX;

    if (boundingRect.height == 0) {
        top = event.pageY;
        bottom = event.pageY;
        left = event.pageX;
    }

    var toReturn = {
        top: top,
        bottom: bottom,
        left: left,
        word: word,
        clientY: boundingRect.top, // get coordinates based on boundingRect instead of event
        height: boundingRect.height
    };
    return toReturn;
}

/**
 * Function to send request to Google to get meaning and synonyms
 * @param {*} info 
 */
function sendRequest(info) {

    var url = "https://www.google.com/search?gl=us&q=define+" + info.word;
    var xmlHTTP = new XMLHttpRequest();
    xmlHTTP.responseType = 'document';
    xmlHTTP.onload = createCallback(); // Calls the createCallback function when it is loading
                                       // This callback updates the meaning and synonyms
    xmlHTTP.open("GET", url, true); // true for asynchronous request
    xmlHTTP.send();
}

/**
 * Callback fuction to extract meaning and synonyms from Google's result
 */
function createCallback() {
    var retrieveMeaning = function () {
        var document = this.responseXML; // Get Google's result page   

        if (!document.querySelectorAll("[data-dobid='hdw']")[0]) {
            return noMeaningFound(createdDiv); //Calls the noMeaningFound function when the meaning is not found
        }

        var word = document.querySelectorAll("[data-dobid='hdw']")[0].textContent;
        var definitionDiv = document.querySelector("div[data-dobid='dfn']");
        var meaning = "";

        if (definitionDiv) {
            definitionDiv.querySelectorAll("span").forEach(function (span) {
                if (!span.querySelector("sup"))
                    meaning = meaning + span.textContent;
            }); // Gets the meaning from the Google's results
        }

        meaning = meaning[0].toUpperCase() + meaning.substring(1);

        //Gets the audio file of the searched word from Google's results
        var audioSrc = document.querySelector("audio[jsname='QInZvb'] source");

        if (audioSrc) {
            audioSrc = audioSrc.src.replace("https://", "http://");
        }

        let synonymsString = ''; 
        let synonyms = document.querySelectorAll("div[role='listitem']")
        // Find for synonyms for the word
        
        if(synonyms) {
            
            if(synonyms.length === 0) {
                synonymsString = 'No synonyms found.' // Set to no synonyms found when there are no synonyms
            }

            else {

                const maxLimit = synonyms.length >= 3 ? 3 : synonyms.length;

                for(let i = 0; i < maxLimit; i++) {
                    
                    // Gets up to a maximum number of 3 synonyms and add it to string
                    synonymsString = synonymsString + synonyms[i].firstChild.innerText + '; '
                }
            }
        }
        
        // Calls the appendToDiv function to update the results
        appendToDiv(createdDiv, {
            word: word,
            meaning: meaning,
            audioSrc: audioSrc,
            synonymsString: synonymsString
        });

    };
    return retrieveMeaning;
}

/**
 * Function to create popup box that shows the details of the word
 * @param {*} info 
 */
function createDiv(info) {

    var hostDiv = document.createElement("div");
    hostDiv.className = "dictionaryDiv";
    hostDiv.style.left = info.left - 10 + "px";
    hostDiv.style.position = "absolute";
    hostDiv.attachShadow({
        mode: 'open'
    });

    var shadow = hostDiv.shadowRoot;
    var style = document.createElement("style");
    //style.textContent = "*{ all: initial}";
    style.textContent = ".mwe-popups{background:#fff;position:absolute;z-index:110;-webkit-box-shadow:0 30px 90px -20px rgba(0,0,0,0.3),0 0 1px #a2a9b1;box-shadow:0 30px 90px -20px rgba(0,0,0,0.3),0 0 1px #a2a9b1;padding:0;font-size:14px;min-width:300px;border-radius:2px}.mwe-popups.mwe-popups-is-not-tall{width:320px}.mwe-popups .mwe-popups-container{color:#222;margin-top:-9px;padding-top:9px;text-decoration:none}.mwe-popups.mwe-popups-is-not-tall .mwe-popups-extract{min-height:40px;max-height:140px;overflow:hidden;margin-bottom:47px;padding-bottom:0}.mwe-popups .mwe-popups-extract{margin:16px;display:block;color:#222;text-decoration:none;position:relative} .mwe-popups.flipped_y:before{content:'';position:absolute;border:8px solid transparent;border-bottom:0;border-top: 8px solid #a2a9b1;bottom:-8px;left:10px}.mwe-popups.flipped_y:after{content:'';position:absolute;border:11px solid transparent;border-bottom:0;border-top:11px solid #fff;bottom:-7px;left:7px} .mwe-popups.mwe-popups-no-image-tri:before{content:'';position:absolute;border:8px solid transparent;border-top:0;border-bottom: 8px solid #a2a9b1;top:-8px;left:10px}.mwe-popups.mwe-popups-no-image-tri:after{content:'';position:absolute;border:11px solid transparent;border-top:0;border-bottom:11px solid #fff;top:-7px;left:7px} .audio{background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAcUlEQVQ4y2P4//8/AyUYQhAH3gNxA7IAIQPmo/H3g/QA8XkgFiBkwHyoYnRQABVfj88AmGZcTuuHyjlgMwBZM7IE3NlQGhQe65EN+I8Dw8MLGgYoFpFqADK/YUAMwOsFigORatFIlYRElaRMWmaiBAMAp0n+3U0kqkAAAAAASUVORK5CYII=);background-position: center;background-repeat: no-repeat;cursor:pointer;margin-left: 8px;opacity: 0.5; width: 16px; display: inline-block;} .audio:hover {opacity: 1;}";
    shadow.appendChild(style);

    //style for link, others
    var style2 = document.createElement("style");
    style2.textContent = '.link-other:hover{text-shadow: none !important; }.link-other:before{content: ""; position: absolute; width:13%; height:2px; background-color: #000; visibility: hidden; -webkit-transform: scaleX(0); -webkit-transition: all 0.3s ease-in-out 0s; transition: all 0.3s ease-in-out 0s; margin-top: 20px;} .link-other:hover:before{visibility: visible; -webkit-transform: scaleX(1); transform: scaleX(1);}'
    shadow.appendChild(style2);

    var encapsulateDiv = document.createElement("div");
    encapsulateDiv.style = "all: initial; text-shadow: transparent 0px 0px 0px, rgba(0,0,0,1) 0px 0px 0px !important;";
    shadow.appendChild(encapsulateDiv);


    var popupDiv = document.createElement("div");
    popupDiv.style = "font-family: arial,sans-serif; border-radius: 12px; border: 1px solid #a2a9b1; box-shadow: 0 0 17px rgba(0,0,0,0.5)";
    encapsulateDiv.appendChild(popupDiv);


    var contentContainer = document.createElement("div");
    contentContainer.className = "mwe-popups-container";
    popupDiv.appendChild(contentContainer);

    var content = document.createElement("div");
    content.className = "mwe-popups-extract";
    content.style = "line-height: 1.4; margin-top: 0px; margin-bottom: 11px; max-height: none";
    contentContainer.appendChild(content);

    var heading = document.createElement("h3");
    heading.style = "margin-block-end: 0px; display:inline-block;";
    heading.textContent = "Searching";

    var meaning = document.createElement("p");
    meaning.style = "margin-top: 10px";
    meaning.textContent = "Please Wait...";

    var audio = document.createElement("div");
    audio.className = "audio";
    audio.innerHTML = "&nbsp;";
    audio.style.display = "none";

    var moreInfo = document.createElement("a");
    moreInfo.className = "link-other"
    moreInfo.href = "https://www.google.com/search?q=define+" + info.word;
    moreInfo.style = "float: right; text-decoration: none; margin: 14px 0; font-size: 12px; background: #f0f0f0; padding: 5px; border-radius: 7px;"
    moreInfo.target = "_blank";

    //div for css design
    var synoWrapper = document.createElement("div");
    synoWrapper.id = "syno-wrapper";
    synoWrapper.className = "syno-wrapper"
    synoWrapper.style = "background: #f0f0f0; border-radius: 7px;"

    const synonymsHeader = document.createElement('p')
    synonymsHeader.id = "syno-header";
    synonymsHeader.style = "padding-left: 5px; margin-block-end: 0px; display:inline-block; font-weight: bold;";
    synonymsHeader.textContent = "Synonyms";

    const lineBreak = document.createElement("br")

    const thesaurusTest = document.createElement('p')
    thesaurusTest.textContent = "Synonyms searching..."
    thesaurusTest.id = "thesau-content"
    thesaurusTest.style = "padding: 10px 5px; font-size: 12px; margin: 0;";
    
    content.appendChild(heading);
    content.appendChild(moreInfo);
    content.appendChild(audio);
    content.appendChild(meaning);
    content.appendChild(synoWrapper);
    synoWrapper.appendChild(synonymsHeader);
    synoWrapper.appendChild(thesaurusTest);
    //Add all details such as meaning and synonyms of the word to the pop up box

    document.body.appendChild(hostDiv);

    if (info.clientY < window.innerHeight / 2) {
        popupDiv.className = "mwe-popups mwe-popups-no-image-tri mwe-popups-is-not-tall";
        hostDiv.style.top = info.bottom + 10 + "px";
        if (info.height == 0) {
            hostDiv.style.top = parseInt(hostDiv.style.top) + 8 + "px";
        }
    } else {
        popupDiv.className = "mwe-popups flipped_y mwe-popups-is-not-tall";
        hostDiv.style.top = info.top - 10 - popupDiv.clientHeight + "px";
        if (info.height == 0) {
            hostDiv.style.top = parseInt(hostDiv.style.top) - 8 + "px";
        }
    }

    return {
        heading: heading,
        meaning: meaning,
        moreInfo: moreInfo,
        audio: audio,
        thesaurusTest: thesaurusTest
    };
}

/**
 * Function to create context menu for the dictionary 
 * @param {Object} info 
 */
function createDivContext(info) {

    var hostDiv = document.createElement("div");
    hostDiv.className = "dictionaryDiv";
    hostDiv.style.left = info.left - 10 + "px";
    hostDiv.style.position = "absolute";
    hostDiv.attachShadow({
        mode: 'open'
    });

    var shadow = hostDiv.shadowRoot;
    var style = document.createElement("style");
    style.textContent = ".mwe-popups{background:#fff;position:absolute;z-index:110;-webkit-box-shadow:0 30px 90px -20px rgba(0,0,0,0.3),0 0 1px #a2a9b1;box-shadow:0 30px 90px -20px rgba(0,0,0,0.3),0 0 1px #a2a9b1;padding:0;font-size:14px;min-width:300px;border-radius:2px}.mwe-popups.mwe-popups-is-not-tall{width:320px}.mwe-popups .mwe-popups-container{color:#222;margin-top:-9px;padding-top:9px;text-decoration:none}.mwe-popups.mwe-popups-is-not-tall .mwe-popups-extract{min-height:40px;max-height:140px;overflow:hidden;margin-bottom:47px;padding-bottom:0}.mwe-popups .mwe-popups-extract{margin:16px;display:block;color:#222;text-decoration:none;position:relative} .mwe-popups.flipped_y:before{content:'';position:absolute;border:8px solid transparent;border-bottom:0;border-top: 8px solid #a2a9b1;bottom:-8px;left:10px}.mwe-popups.flipped_y:after{content:'';position:absolute;border:11px solid transparent;border-bottom:0;border-top:11px solid #fff;bottom:-7px;left:7px} .mwe-popups.mwe-popups-no-image-tri:before{content:'';position:absolute;border:8px solid transparent;border-top:0;border-bottom: 8px solid #a2a9b1;top:-8px;left:10px}.mwe-popups.mwe-popups-no-image-tri:after{content:'';position:absolute;border:11px solid transparent;border-top:0;border-bottom:11px solid #fff;top:-7px;left:7px} .audio{background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAcUlEQVQ4y2P4//8/AyUYQhAH3gNxA7IAIQPmo/H3g/QA8XkgFiBkwHyoYnRQABVfj88AmGZcTuuHyjlgMwBZM7IE3NlQGhQe65EN+I8Dw8MLGgYoFpFqADK/YUAMwOsFigORatFIlYRElaRMWmaiBAMAp0n+3U0kqkAAAAAASUVORK5CYII=);background-position: center;background-repeat: no-repeat;cursor:pointer;margin-left: 8px;opacity: 0.5; width: 16px; display: inline-block;} .audio:hover {opacity: 1;}";
    shadow.appendChild(style);

    //style for link, others
    var style2 = document.createElement("style");
    style2.textContent = '.link-other:hover{text-shadow: none !important; }.link-other:before{content: ""; position: absolute; width:13%; height:2px; background-color: #000; visibility: hidden; -webkit-transform: scaleX(0); -webkit-transition: all 0.3s ease-in-out 0s; transition: all 0.3s ease-in-out 0s; margin-top: 20px;} .link-other:hover:before{visibility: visible; -webkit-transform: scaleX(1); transform: scaleX(1);}'
    shadow.appendChild(style2);

    var encapsulateDiv = document.createElement("div");
    encapsulateDiv.style = "all: initial; text-shadow: transparent 0px 0px 0px, rgba(0,0,0,1) 0px 0px 0px !important;";
    shadow.appendChild(encapsulateDiv);


    var popupDiv = document.createElement("div");
    popupDiv.style = "font-family: arial,sans-serif; border-radius: 12px; border: 1px solid #a2a9b1; box-shadow: 0 0 17px rgba(0,0,0,0.5)";
    encapsulateDiv.appendChild(popupDiv);


    var contentContainer = document.createElement("div");
    contentContainer.className = "mwe-popups-container";
    popupDiv.appendChild(contentContainer);

    var content = document.createElement("div");
    content.className = "mwe-popups-extract";
    content.style = "line-height: 1.4; margin-top: 0px; margin-bottom: 11px; max-height: none";
    contentContainer.appendChild(content);

    var heading = document.createElement("h3");
    heading.style = "margin-block-end: 0px; display:inline-block;";
    heading.textContent = "Searching";

    var meaning = document.createElement("p");
    meaning.style = "margin-top: 10px";
    meaning.textContent = "Please Wait...";

    var audio = document.createElement("div");
    audio.className = "audio";
    audio.innerHTML = "&nbsp;";
    audio.style.display = "none";

    var moreInfo = document.createElement("a");
    moreInfo.className = "link-other"
    moreInfo.href = "https://www.google.com/search?q=define+" + info.word;
    moreInfo.style = "float: right; text-decoration: none; margin: 14px 0; font-size: 12px; background: #f0f0f0; padding: 5px; border-radius: 7px;"
    moreInfo.target = "_blank";

    //div for css design
    var synoWrapper = document.createElement("div");
    synoWrapper.id = "syno-wrapper";
    synoWrapper.className = "syno-wrapper"
    synoWrapper.style = "background: #f0f0f0; border-radius: 7px;"

    const synonymsHeader = document.createElement('p')
    synonymsHeader.id = "syno-header";
    synonymsHeader.style = "padding-left: 5px; margin-block-end: 0px; display:inline-block; font-weight: bold;";
    synonymsHeader.textContent = "Synonyms";

    const lineBreak = document.createElement("br")

    const thesaurusTest = document.createElement('p')
    thesaurusTest.textContent = "Synonyms searching..."
    thesaurusTest.id = "thesau-content"
    thesaurusTest.style = "padding: 10px 5px; font-size: 12px; margin: 0;";
    
    content.appendChild(heading);
    content.appendChild(moreInfo);
    content.appendChild(audio);
    content.appendChild(meaning);
    content.appendChild(synoWrapper);
    synoWrapper.appendChild(synonymsHeader);
    synoWrapper.appendChild(thesaurusTest);
    //Add all details such as meaning and synonyms of the word to the pop up box

    document.body.appendChild(hostDiv);

    if (info.clientY < window.innerHeight / 2) {
        popupDiv.className = "mwe-popups mwe-popups-no-image-tri mwe-popups-is-not-tall";
        hostDiv.style.top = info.bottom + 10 + "px";
        if (info.height == 0) {
            hostDiv.style.top = parseInt(hostDiv.style.top) + 8 + "px";
        }
    } else {
        popupDiv.className = "mwe-popups flipped_y mwe-popups-is-not-tall";
        hostDiv.style.top = info.top - 10 - popupDiv.clientHeight + "px";
        if (info.height == 0) {
            hostDiv.style.top = parseInt(hostDiv.style.top) - 8 + "px";
        }
    }

    return {
        heading: heading,
        meaning: meaning,
        moreInfo: moreInfo,
        audio: audio,
        thesaurusTest: thesaurusTest
    };

}

/**
 * Function to get the selection text box bounds
 * @param {*} selection 
 */
function getSelectionCoords(selection) {
    var oRange = selection.getRangeAt(0); //get the text range
    var oRect = oRange.getBoundingClientRect();
    return oRect;
}

/**
 * Function to update the popupbox with details from Google
 * @param {*} createdDiv 
 * @param {*} content 
 */
function appendToDiv(createdDiv, content) {

    var hostDiv = createdDiv.heading.getRootNode().host;
    var popupDiv = createdDiv.heading.getRootNode().querySelectorAll("div")[1];

    var heightBefore = popupDiv.clientHeight;
    createdDiv.heading.textContent = content.word;
    createdDiv.meaning.textContent = content.meaning;
    createdDiv.moreInfo.textContent = "More »";
    createdDiv.thesaurusTest.textContent = content.synonymsString;
    // Update the placeholder text to the meaning and synonyms of the word

    var heightAfter = popupDiv.clientHeight;
    var difference = heightAfter - heightBefore;

    if (popupDiv.classList.contains("flipped_y")) {
        hostDiv.style.top = parseInt(hostDiv.style.top) - difference + 1 + "px";
    }

    if (content.audioSrc) {
        var sound = document.createElement("audio");
        sound.src = content.audioSrc;
        createdDiv.audio.style.display = "inline-block";
        createdDiv.audio.addEventListener("click", function () {
            sound.play();
        });
    }
}

/**
 * Function to show the no meaning found message
 * @param {HTMLElement} createdDiv The pop up box containing the details of the word 
 */
function noMeaningFound(createdDiv) {
    createdDiv.heading.textContent = "Sorry";
    createdDiv.meaning.textContent = "No definition found.";
    createdDiv.thesaurusTest.textContent = 'No synonyms found.'
}

/**
 * Function to remove the popup box
 * @param {*} event 
 */
function removeMeaning(event) {
    var element = event.target;
    if (!element.classList.contains("dictionaryDiv")) {
        document.querySelectorAll(".dictionaryDiv").forEach(function (Node) {
            Node.remove();
        });
    }
}