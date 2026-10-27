// Get HTML elements
const welcomeForm = document.querySelector("#welcome-form");
const welcomeInput = document.querySelector("#welcome-name");

const helloForm = document.querySelector("#hello-form");
const helloInput = document.querySelector("#hello-name");
const helloTitle = document.querySelector("#hello-title");
const helloList = document.querySelector("#hello-list");

const goodbyeForm = document.querySelector("#goodbye-form");
const goodbyeInput = document.querySelector("#goodbye-name");
const goodbyeTitle = document.querySelector("#goodbye-title");
const goodbyeList = document.querySelector("#goodbye-list");

const message = document.querySelector("#message");

// Store names in arrays
const namesToGreet = [];
const namesRemoved = [];

// Clean extra spaces
function cleanName(value) {
    return value.trim().replace(/\s+/g, " ");
}

// Check whether a name already exists
function nameExists(names, name) {
    return names.some(
        existingName =>
            existingName.toLowerCase() === name.toLowerCase()
    );
}

// Display a list of names
function renderList(listElement, names, emptyMessage) {
    listElement.replaceChildren();

    if (names.length === 0) {
        const item = document.createElement("li");
        item.className = "empty";
        item.textContent = emptyMessage;
        listElement.appendChild(item);
        return;
    }

    names.forEach(name => {
        const item = document.createElement("li");
        item.textContent = name;
        listElement.appendChild(item);
    });
}

// Display feedback
function showMessage(text) {
    message.textContent = text;
}

// Add a name to the Hello list
function addName(input) {
    const name = cleanName(input.value);

    if (!name) {
        showMessage("Please enter a name first.");
        input.focus();
        return;
    }

    if (nameExists(namesToGreet, name)) {
        showMessage(`${name} is already in the greeting list.`);
        return;
    }

    namesToGreet.push(name);

    renderList(helloList, namesToGreet, "No names yet");

    helloTitle.textContent = `Hello, ${name}!`;

    input.value = "";
    showMessage(`Hello, ${name}!`);
}

// Welcome form
welcomeForm.addEventListener("submit", event => {
    event.preventDefault();
    addName(welcomeInput);
});

// Hello form
helloForm.addEventListener("submit", event => {
    event.preventDefault();
    addName(helloInput);
});

// Remove a name and add it to the Goodbye list
goodbyeForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = cleanName(goodbyeInput.value);

    if (!name) {
        showMessage("Enter a name to remove.");
        goodbyeInput.focus();
        return;
    }

    const index = namesToGreet.findIndex(
        existingName =>
            existingName.toLowerCase() === name.toLowerCase()
    );

    if (index === -1) {
        showMessage(`${name} is not in the greeting list.`);
        return;
    }

    const [removedName] = namesToGreet.splice(index, 1);

    namesRemoved.push(removedName);

    renderList(helloList, namesToGreet, "No names yet");

    renderList(
        goodbyeList,
        namesRemoved,
        "No names removed yet"
    );

    goodbyeTitle.textContent = `Goodbye, ${removedName}!`;

    goodbyeInput.value = "";
    showMessage(`Goodbye, ${removedName}!`);
});

// Initial display
renderList(helloList, namesToGreet, "No names yet");
renderList(goodbyeList, namesRemoved,"No names removed yet");