// ==UserScript==
// @name         umimecesky.cz+
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Kdyz odpovite spatne script vam to prida jako karticku do anki na procviceni
// @author       JunkMeal
// @match        http*://*.umimecesky.cz/*
// @grant        none
// ==/UserScript==

function invoke(action, params={}, version=6, key="lol") {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('error', () => reject('failed to issue request'));
        xhr.addEventListener('load', () => {
            try {
                const response = JSON.parse(xhr.responseText);
                if (Object.getOwnPropertyNames(response).length != 2) {
                    throw 'response has an unexpected number of fields';
                }
                if (!response.hasOwnProperty('error')) {
                    throw 'response is missing required error field';
                }
                if (!response.hasOwnProperty('result')) {
                    throw 'response is missing required result field';
                }
                if (response.error) {
                    throw response.error;
                }
                resolve(response.result);
            } catch (e) {
                reject(e);
            }
        });

        xhr.open('POST', 'http://localhost:8765');
        xhr.send(JSON.stringify({action, version, params, key}));
    });
}

console.log("[uc+] injected")
let old = clickVariant
clickVariant = async (el) => {
    let spravne = false
    let spravny = questions[questionOffset].options[0].correct == 1 ? 0 : 1;
    if (el.hasClass("option0") && questions[questionOffset].options[0].correct == 1) {
      spravne = true
    }
    else if (el.hasClass("option1") && questions[questionOffset].options[1].correct == 1) {
      spravne = true;
    }

    if (!spravne) {
        const name = $("html body div#content div#exercise div.flex-horizontal.jc-flex-start.ai-flex-end.nowrap div#skillContainer center p.nomargin").clone().children().remove().end().text().trim()
        const decks = await invoke("deckNames")
        if(!decks.includes("umimecesky.cz")) await invoke("createDeck", { deck:"umimecesky.cz"} )
        if(!decks.includes("umimecesky.cz::" + name)) await invoke("createDeck", {deck:"umimecesky.cz::" + name})
        await invoke("addNote",{"note": {
            "deckName": "umimecesky.cz::" + name,
            "modelName": "Basic",
            "fields": {
                "Front": $(getFormattedParts(questions[questionOffset].question)).text(),
                "Back": `<b>${$(getFormattedParts(questions[questionOffset].options[spravny].option)).text()}</b><br><br>${$(getFormattedParts(questions[questionOffset].explanation)).text()}`
            },
            "options": {
                "allowDuplicate": false,
                "duplicateScope": "deck",
                "duplicateScopeOptions": {
                    "deckName": "umimecesky.cz::" + name,
                    "checkChildren": false,
                    "checkAllModels": false
                }
            }}}).catch(console.error)
    }
    return old(el)
}
