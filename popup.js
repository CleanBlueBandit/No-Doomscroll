class CountUp {
    constructor(target, endVal, options = {}) {
        this.el = typeof target === "string"
            ? document.getElementById(target)
            : target;

        this.options = {
            startVal: 0,
            decimalPlaces: 0,
            duration: 2,
            useEasing: true,
            useGrouping: true,
            separator: ",",
            decimal: ".",
            prefix: "",
            suffix: "",
            autoAnimate: false,
            autoAnimateOnce: false,
            autoAnimateDelay: 200,
            ...options
        };

        this.endVal = Number(endVal);
        this.startVal = Number(this.options.startVal);
        this.frameVal = this.startVal;
        this.raf = null;
        this.observer = null;
        this.hasAnimated = false;

        if (!this.el || !Number.isFinite(this.endVal) ||
            !Number.isFinite(this.startVal)) {
            throw new Error("CountUp: invalid target or number");
        }

        this.printValue(this.startVal);

        if (this.options.autoAnimate) {
            this.observe();
        }
    }

    easeOutExpo(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    formatNumber(value) {
        const { decimalPlaces, useGrouping, separator, decimal,
            prefix, suffix } = this.options;

        const fixed = Math.abs(value).toFixed(decimalPlaces);
        let [integer, fraction] = fixed.split(".");

        if (useGrouping) {
            integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
        }

        const sign = value < 0 ? "-" : "";
        return sign + prefix + integer +
            (fraction !== undefined ? decimal + fraction : "") + suffix;
    }

    printValue(value) {
        const result = this.formatNumber(value);

        if (this.el.tagName === "INPUT") {
            this.el.value = result;
        } else {
            this.el.textContent = result;
        }
    }

    start(callback) {
        cancelAnimationFrame(this.raf);

        const from = this.frameVal;
        const to = this.endVal;
        const duration = Math.max(0, Number(this.options.duration) * 1000);
        const startTime = performance.now();

        if (this.options.onStartCallback) {
            this.options.onStartCallback();
        }

        if (duration === 0 || from === to) {
            this.frameVal = to;
            this.printValue(to);
            callback?.();
            this.options.onCompleteCallback?.();
            return;
        }

        const animate = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = this.options.useEasing
                ? this.easeOutExpo(progress)
                : progress;

            this.frameVal = Number(
                (from + (to - from) * eased)
                    .toFixed(this.options.decimalPlaces)
            );

            if (progress === 1) {
                this.frameVal = to;
            }

            this.printValue(this.frameVal);

            if (progress < 1) {
                this.raf = requestAnimationFrame(animate);
            } else {
                callback?.();
                this.options.onCompleteCallback?.();
            }
        };

        this.raf = requestAnimationFrame(animate);
    }

    update(newEndVal) {
        if (!Number.isFinite(Number(newEndVal))) {
            throw new Error("CountUp: invalid end value");
        }

        this.endVal = Number(newEndVal);
        this.start();
    }

    reset() {
        cancelAnimationFrame(this.raf);
        this.frameVal = Number(this.options.startVal);
        this.printValue(this.frameVal);
        this.hasAnimated = false;
    }

    observe() {
        this.observer?.disconnect();

        this.observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting &&
                (!this.options.autoAnimateOnce || !this.hasAnimated)) {
                this.hasAnimated = true;
                setTimeout(() => this.start(), this.options.autoAnimateDelay);
            }
        });

        this.observer.observe(this.el);
    }

    onDestroy() {
        cancelAnimationFrame(this.raf);
        this.observer?.disconnect();
    }
}


async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

async function updateStats(){
    const { totalBlocked = 0 } = await chrome.storage.local.get("totalBlocked");
    const counter = new CountUp(
        document.querySelector("#blockedsites"),
        totalBlocked,
        {
            prefix: "Prevented ",
            suffix: " websites",
            duration: 1.5
        }
    );
    const { scrollAttempts = 0 } = await chrome.storage.local.get("scrollAttempts");
    const scrollcounter = new CountUp(
        document.querySelector("#blockedscrolls"),
        scrollAttempts,
        {
            prefix: "Prevented ",
            duration: 1.5
        }
    );
    await sleep(150);
    counter.start();
    scrollcounter.start();
}

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;

    if (changes.totalBlocked || changes.scrollAttempts) {
        updateStats();
    }
});

updateStats();