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
                // Prevent noti from going off screen.
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
    // Create open notification instance.
    const ON = new OpenNotification();
    // Add as many notifications as you wish!
    // OpenNoti will automatically manage when to display notifications.
    for (let i = 1; i <= 2000; i++) {
        const dur = getRndInteger(1000, 8000);
        ON.add({ message: `${i}: Hello: ${dur}.`, duration: dur });
    }
}
demo();
