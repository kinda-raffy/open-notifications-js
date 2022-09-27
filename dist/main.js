"use strict";
class NotiNode {
    constructor(_noti) {
        this.DOMElement = undefined;
        this.next = null;
        this.noti = _noti;
    }
}
class WaitQueue {
    constructor() {
        this.head = null;
        this.tail = null;
    }
    append(noti) {
        const node = new NotiNode(noti);
        if (this.tail === null) {
            this.head = node;
            this.tail = node;
            this.head.next = this.tail;
        }
        else {
            const temp = this.tail;
            this.tail = node;
            temp.next = this.tail;
        }
    }
    pop() {
        if (this.head === null) {
            return null;
        }
        const node = this.head;
        if (this.head === this.tail) {
            this.head = this.tail = null;
        }
        else {
            this.head = this.head.next;
        }
        return node.noti;
    }
    isEmpty() {
        return this.head === null;
    }
}
class DisplayList {
    constructor() {
        this.head = null;
        this.currentHeight = 15; // Starting position of first noti box.
    }
    append(_noti) {
        const node = new NotiNode(_noti);
        // Notification fails to display due to full list.
        if (!this.displayNoti(node)) {
            return false;
        }
        // Notification successfully displayed; add to list.
        if (this.head === null) {
            this.head = node;
        }
        else {
            let current = this.head;
            while (current.next !== null) {
                current = current.next;
            }
            current.next = node;
        }
        return true;
    }
    remove(node) {
        // Empty list.
        if (this.head === null) {
            return;
        }
        // Remove from head.
        if (this.head === node) {
            this.head = this.head.next;
            this.decrementNotiBoxes(node);
            return;
        }
        // Remove from middle and tail.
        let current = this.head;
        while (current.next !== null) {
            if (current.next === node) {
                current.next = current.next.next;
                this.decrementNotiBoxes(node);
                return;
            }
            current = current.next;
        }
    }
    size() {
        let count = 0;
        let current = this.head;
        while (current !== null) {
            count++;
            current = current.next;
        }
        return count;
    }
    displayNoti(node) {
        // Create noti hidden element and append to DOM.
        const [notiBox, notiProgress] = this.createNoti(node);
        // Determine noti height.
        const notiHeight = notiBox.offsetHeight;
        if (this.currentHeight + notiHeight > window.innerHeight / 2) {
            // Noti box will not fit on screen. Remove hidden noti and return.
            notiBox.remove();
            return false;
        }
        // Update noti box position.
        this.setNotiPosition(notiBox);
        // Display noti to user.
        notiBox.style.visibility = "visible";
        // Update NotiNode's DOMElement.
        node.DOMElement = notiBox;
        // Draw progress bar iteratively.
        const iterID = this.handleProgressBar(node, notiBox, notiProgress);
        // Remove noti if the user clicks on it.
        this.handleNotiClick(iterID, node, notiBox);
        return true;
    }
    createNoti(node) {
        // Noti Box Container.
        const notiBox = document.createElement("div");
        notiBox.setAttribute("class", "open-noti-js");
        // Noti Text.
        const notiText = document.createElement("p");
        notiText.appendChild(document.createTextNode(node.noti.message));
        notiText.setAttribute("class", "open-noti-js");
        // Noti Progress Bar.
        const notiProgress = document.createElement("progress");
        notiProgress.setAttribute("class", "open-noti-js");
        notiProgress.max = 100;
        // If only a start or end colour is provided, use it for the entire progress bar.
        if (node.noti.progressColourStart !== undefined) {
            // Set progress bar colour.
            notiBox.style.setProperty("--progress-bar-color-start", node.noti.progressColourStart);
            if (node.noti.progressColourEnd === undefined) {
                notiBox.style.setProperty("--progress-bar-color-end", node.noti.progressColourStart);
            }
        }
        if (node.noti.progressColourEnd !== undefined) {
            // Set progress bar colour.
            notiBox.style.setProperty("--progress-bar-color-end", node.noti.progressColourEnd);
            if (node.noti.progressColourStart === undefined) {
                notiBox.style.setProperty("--progress-bar-color-start", node.noti.progressColourEnd);
            }
        }
        // Set noti background colour.
        if (node.noti.backgroundColour !== undefined) {
            notiBox.style.backgroundColor = node.noti.backgroundColour;
        }
        // Render invisible noti to determine height.
        notiBox.style.visibility = "hidden";
        // Append elements to DOM.
        document.body.appendChild(notiBox);
        notiBox.appendChild(notiProgress);
        notiBox.appendChild(notiText);
        return [notiBox, notiProgress];
    }
    setNotiPosition(notiBox) {
        const PADDING = 5; // Padding between consecutive noti boxes.
        notiBox.style.bottom = `${this.currentHeight + PADDING}px`;
        this.currentHeight += notiBox.offsetHeight + PADDING;
    }
    handleProgressBar(node, notiBox, notiProgress) {
        let step = 0; // Initial step.
        const resolution = 30; // smoothness of line animation.
        let iterID = setInterval(() => {
            // Calculate step value using durationMS.
            step += resolution / node.noti.duration; // Calculate step value using the duration given.
            let curProgress = notiProgress.max * step; // Find current progress.
            notiProgress.value = curProgress;
            // Remove noti when progress is 100%.
            if (curProgress >= 100) {
                clearInterval(iterID);
                // Remove noti from list.
                this.remove(node);
                // Remove noti from DOM.
                notiBox.remove();
            }
        }, resolution);
        return iterID;
    }
    handleNotiClick(iterID, node, notiBox) {
        notiBox.addEventListener("click", () => {
            clearInterval(iterID);
            // Remove noti from list.
            this.remove(node);
            // Remove noti from DOM.
            notiBox.remove();
        });
    }
    decrementNotiBoxes(deletedNode) {
        var _a, _b;
        const PADDING = 5;
        const remHeight = (_b = (_a = deletedNode.DOMElement) === null || _a === void 0 ? void 0 : _a.offsetHeight) !== null && _b !== void 0 ? _b : 0;
        this.currentHeight -= remHeight + PADDING;
        let current = deletedNode.next;
        while (current !== null) {
            if (current.DOMElement !== undefined) {
                // Bottom position of noti box.
                const notiBottom = parseInt(current.DOMElement.style.bottom);
                // Prevent noti from going off-screen.
                if ((notiBottom - remHeight) >= 0) {
                    current.DOMElement.style.bottom = `${notiBottom - remHeight - PADDING}px`;
                }
            }
            current = current.next;
        }
    }
}
class OpenNotification {
    constructor() {
        this.notiQueue = new WaitQueue();
        this.notiList = new DisplayList();
        this.startNotiScanner();
    }
    add(noti) {
        this.notiQueue.append(noti);
    }
    startNotiScanner() {
        setInterval(() => {
            this.updateList();
        }, 500);
    }
    updateList() {
        const noti = this.notiQueue.pop();
        if (noti !== null) {
            if (!this.notiList.append(noti)) {
                // Append to wait queue if display list is full.
                this.notiQueue.append(noti);
            }
        }
    }
}
function demo() {
    // Random number generator.
    function getRndInteger(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
    function getRandomMessage() {
        const dictionary = ['Curabitur', 'varius', 'id', 'ante', 'ac', 'condimentum.', 'Etiam', 'in', 'dolor', 'consectetur,', 'faucibus', 'dui', 'a,', 'malesuada', 'elit.', 'Lorem', 'ipsum', 'dolor', 'sit', 'amet,', 'consectetur', 'adipiscing', 'elit.', 'Nulla', 'a', 'nunc', 'hendrerit,', 'laoreet', 'justo', 'id,', 'ornare', 'velit.', 'Vivamus', 'vel', 'dui', 'eu', 'lacus', 'dapibus', 'blandit.', 'Morbi', 'elit', 'erat,', 'aliquet', 'commodo', 'pulvinar', 'vitae,', 'convallis', 'vel', 'nisl.', 'Cras', 'et', 'erat', 'et', 'sem', 'molestie', 'eleifend.', 'Vestibulum', 'vitae', 'nunc', 'vitae', 'nisi', 'porttitor', 'ornare', 'eget', 'at', 'lorem.', 'Aenean', 'venenatis', 'eros', 'quis', 'turpis', 'lacinia', 'posuere.', 'Curabitur', 'nec', 'posuere', 'augue.', 'Pellentesque', 'habitant', 'morbi', 'tristique', 'senectus', 'et', 'netus', 'et', 'malesuada', 'fames', 'ac', 'turpis', 'egestas.', 'Fusce', 'pretium', 'gravida', 'sagittis.', 'Pellentesque', 'habitant', 'morbi', 'tristique', 'senectus', 'et', 'netus', 'et', 'malesuada', 'fames', 'ac', 'turpis', 'egestas.', 'Nullam', 'posuere', 'augue', 'sed', 'turpis', 'cursus', 'suscipit.', 'Nam', 'nunc', 'erat,', 'tempus', 'in', 'ex', 'luctus,', 'malesuada', 'pharetra', 'metus.', 'In', 'odio', 'magna,', 'eleifend', 'id', 'purus', 'sit', 'amet,', 'porttitor', 'tincidunt', 'odio.', 'Fusce', 'id', 'mattis', 'nunc.', 'Vestibulum', 'ante', 'ipsum', 'primis', 'in', 'faucibus', 'orci', 'luctus', 'et', 'ultrices', 'posuere', 'cubilia', 'curae;', 'Sed', 'sodales', 'eget', 'orci', 'in', 'suscipit.', 'Suspendisse', 'a', 'scelerisque', 'purus.', 'Pellentesque', 'sit', 'amet', 'dignissim', 'nibh,', 'vel', 'malesuada', 'turpis.', 'Duis', 'eget', 'ante', 'id', 'sem', 'eleifend', 'auctor.', 'Donec', 'at', 'ultrices', 'nisl,', 'ac', 'porta', 'neque.', 'Suspendisse', 'faucibus', 'purus', 'nisi,', 'at', 'convallis', 'ante', 'tempus', 'ut.', 'Praesent', 'eget', 'nibh', 'a', 'velit', 'mattis', 'consequat.', 'Duis', 'purus', 'eros,', 'sagittis', 'accumsan', 'molestie', 'vitae,', 'rhoncus', 'eu', 'neque.', 'Proin', 'at', 'posuere', 'lectus,', 'quis', 'tincidunt', 'enim.', 'Interdum', 'et', 'malesuada', 'fames', 'ac', 'ante', 'ipsum', 'primis', 'in', 'faucibus.', 'Duis', 'ullamcorper', 'felis', 'at', 'dolor', 'luctus', 'ullamcorper', 'nec', 'blandit', 'mauris.', 'Donec', 'semper', 'egestas', 'metus,', 'at', 'porta', 'erat', 'sagittis', 'vel.', 'Donec', 'id', 'leo', 'tempus,', 'rhoncus', 'est', 'vitae,', 'dignissim', 'arcu.', 'Quisque', 'egestas', 'malesuada', 'lorem,', 'vel', 'mattis', 'nisl', 'sollicitudin', 'eget.', 'Duis', 'vulputate', 'purus', 'non', 'metus', 'dignissim,', 'vitae', 'aliquet', 'est', 'congue.', 'Nunc', 'nunc', 'risus,', 'scelerisque', 'ac', 'lobortis', 'pharetra,', 'tristique', 'a', 'velit.', 'Integer', 'porttitor', 'malesuada', 'imperdiet.', 'Nam', 'mattis', 'accumsan', 'lacus,', 'ac', 'porttitor', 'justo', 'vehicula', 'non.', 'Praesent', 'nec', 'consequat', 'dui.', 'In', 'hac', 'habitasse', 'platea', 'dictumst.', 'Phasellus', 'sollicitudin', 'blandit', 'dui.', 'Cras', 'rutrum', 'suscipit', 'tincidunt.', 'Fusce', 'ex', 'risus,', 'iaculis', 'in', 'magna', 'et,', 'scelerisque', 'condimentum', 'velit.', 'Pellentesque', 'tincidunt,', 'velit', 'at', 'posuere', 'finibus,', 'magna', 'elit', 'tristique', 'magna,', 'ut', 'pharetra', 'leo', 'sem', 'id', 'nisl.', 'Ut', 'sodales', 'est', 'vitae', 'purus', 'venenatis,', 'nec', 'gravida', 'lectus', 'commodo.', 'Aliquam', 'venenatis', 'consectetur', 'arcu', 'sed', 'vehicula.', 'Integer', 'pretium,', 'velit', 'vel', 'blandit', 'pretium,', 'magna', 'nisl', 'vestibulum', 'leo,', 'vel', 'feugiat', 'tortor', 'velit', 'non', 'enim.', 'Integer', 'ullamcorper', 'nisl', 'eu', 'consequat', 'blandit.', 'Suspendisse', 'potenti.', 'Duis', 'tempor,', 'nunc', 'eget', 'ultrices', 'euismod,', 'neque', 'tellus', 'euismod', 'sem,', 'sed', 'posuere', 'ligula', 'dui', 'in', 'tortor.', 'Etiam', 'commodo', 'congue', 'velit,', 'et', 'ullamcorper', 'nisl', 'ultrices', 'et.', 'Duis', 'gravida', 'lorem', 'mi,', 'sit', 'amet', 'ultrices', 'justo', 'tristique', 'non.', 'Integer', 'convallis', 'sagittis', 'eros', 'sed', 'laoreet.', 'Donec', 'et', 'metus', 'vel', 'lectus', 'rutrum', 'commodo.'];
        let message = "";
        const messageLen = getRndInteger(4, 7);
        for (let i = 0; i < messageLen; i++) {
            const word = dictionary[getRndInteger(0, dictionary.length)];
            message += `${word} `;
        }
        message = message[0].toUpperCase() + message.slice(1, message.length - 1) + ".";
        return message;
    }
    function getPastelColour() {
        return "hsla(" + ~~(360 * Math.random()) + "," +
            "70%," +
            "70%,1)";
    }
    // Create open notification instance.
    const ON = new OpenNotification();
    // Add as many notifications as you wish!
    // OpenNoti will automatically manage when to display notifications.
    for (let i = 1; i <= 2000; i++) {
        ON.add({
            message: getRandomMessage(),
            duration: getRndInteger(1000, 5000),
            progressColourStart: getPastelColour(),
            progressColourEnd: getPastelColour()
        });
    }
}
demo();
